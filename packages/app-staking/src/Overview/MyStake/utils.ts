import { Nominations, StakingLedger, Exposure } from '@cennznet/types';
import { ApiPromise } from '@polkadot/api';
import { BalanceOf } from '@polkadot/types/interfaces';
import { BigNumber } from "bignumber.js";
import BN from 'bn.js';

import { Nominate, Stake } from './index';

const PERBILL_DIVIDED_NUMBER = new BigNumber(1000000000);

export async function getStakes(
  api: ApiPromise,
  addresses: string[]
): Promise<Stake[]> {
  const stakeAccountPairMap: Record<
    string,
    {
      stashAccountAddress: string;
      controllerAccountAddress: string;
    }
  > = {}; // Key is `stashAccountAddress-controllerAccountAddress`, use map for deduplicate
  await Promise.all(
    addresses.map(
      address =>
        new Promise<void>(async resolve => {
          const controllerAddress = await getControllerByStash(address, api);
          if (controllerAddress !== null) {
            stakeAccountPairMap[`${address}-${controllerAddress}`] = {
              stashAccountAddress: address,
              controllerAccountAddress: controllerAddress
            };
          }

          const stashAddress = await getStashByController(address, api);
          if (stashAddress !== null) {
            stakeAccountPairMap[`${stashAddress}-${address}`] = {
              stashAccountAddress: stashAddress,
              controllerAccountAddress: address
            };
          }
          resolve();
        })
    )
  );

  const stakes = await Promise.all(
    Object.values(stakeAccountPairMap).map(
      accountPair =>
        new Promise<Stake>(async resolve => {
          const stake = await getStake(
            accountPair.stashAccountAddress,
            accountPair.controllerAccountAddress,
            api
          );
          resolve(stake);
        })
    )
  );

  return stakes;
}

/**
 * Return null if there is no stake with this stash account address
 * @param address
 */
export async function getControllerByStash(
  address: string,
  api: ApiPromise
): Promise<string | null> {
  const controllerAccountAddressOption = await api.query.staking.bonded(
    address
  );

  if (controllerAccountAddressOption.isNone) {
    return null;
  }

  return controllerAccountAddressOption.toString();
}

/**
 * Return null if there is no stake with this controller account address
 */
export async function getStashByController(
  address: string,
  api: ApiPromise
): Promise<string | null> {
  const ledgerOption = await api.query.staking.ledger(address);

  if (ledgerOption.isNone) {
    return null;
  }

  return ledgerOption.unwrapOrDefault().stash.toString();
}

export async function getStake(
  stashAccountAddress: string,
  controllerAccountAddress: string,
  api: ApiPromise
): Promise<Stake> {
  // Get stakeAmount and rewardDestinationsAddresses
  const stakeLedger = (
    await api.query.staking.ledger(controllerAccountAddress)
  ).unwrapOrDefault() as StakingLedger;
  const stakeAmount = new BN(stakeLedger.total.toString());

  const rewardDestination = await api.query.rewards.payee(stashAccountAddress);
  let rewardDestinationsAddress: string;
  if (rewardDestination.toString() === stashAccountAddress ) {
    rewardDestinationsAddress = stashAccountAddress;
  } else if (rewardDestination.toString() === controllerAccountAddress) {
    rewardDestinationsAddress = controllerAccountAddress;
  } else if (rewardDestination) {
    rewardDestinationsAddress = rewardDestination.toString();
  } else {
    throw new Error(`reward destinations is not stash, controller or account`);
  }

  // Get nominatorsAddresses
  const nominates = await getNominates(stashAccountAddress, api);

  return {
    stashAccountAddress,
    controllerAccountAddress,
    stakeAmount,
    rewardDestinationsAddress,
    nominates
  };
}

export async function getNominates(
  stashAccountAddress: string,
  api: ApiPromise
): Promise<Nominate[]> {
  const nominates: Nominate[] = [];
  // Get nominatorsAddresses
  const nominationsOption = await api.query.staking.nominators(
    stashAccountAddress
  );
  if (nominationsOption.isNone) {
    return [];
  }
  const nominations = nominationsOption.unwrapOrDefault() as Nominations;
  const nominateToAddresses =
    nominations && nominations.targets
      ? (nominations.targets.toJSON() as string[])
      : [];

  // For each nominator, get stakeShare, commission and nextRewardEstimate
  await Promise.all(
    nominateToAddresses.map(
      async nominateToAddress =>
        new Promise<void>(async resolve => {
          // Get commission
          // TODO: test in a case that commission is not 0
          const commission = new BigNumber(
            (
              await api.query.staking.validators(nominateToAddress)
            ).commission.toString()
          ).div(PERBILL_DIVIDED_NUMBER);

          // Get stakeShare
          const { stakeShare, elected } = await getStakeShare(
            nominateToAddress,
            stashAccountAddress,
            api
          );

          // Get reward estimate
          const nextRewardEstimate = await getNextRewardEstimate(
            api,
            new BigNumber(commission),
            stakeShare
          );

          nominates.push({
            nominateToAddress,
            stakeShare,
            commission: new BigNumber(commission),
            elected,
            nextRewardEstimate
          });

          resolve();
        })
    )
  );
  return nominates;
}

// Reference: https://github.com/cennznet/cennznet/wiki/Validator-Guide#rewards
// Reference 2: cennznet/crml/staking/src/rewars/mod.rs/fn enqueue_reward_payouts&calculate_npos_payouts
const INFLATION_DIVIDED_NUMBER = new BigNumber(10).pow(new BigNumber(18));
export async function getNextRewardEstimate(
  api: ApiPromise,
  commission: BigNumber,
  stakeShare: BigNumber
): Promise<BigNumber> {
  const inflationBalanceOf = (await api.query.rewards.targetInflationPerStakingEra()) as BalanceOf;
  const inflationRate = new BigNumber(inflationBalanceOf.toString()).div(
    INFLATION_DIVIDED_NUMBER
  ); // If inflationBalanceOf is 1,000,000,000,000,000(10pow16), than inflation should be 1.01 (10pow16/10pow18 + 1)
  const totalTransactionFees = new BigNumber(
    (await api.query.rewards.transactionFeePot()).toString()
  );
  const totalPayout = totalTransactionFees
    .multipliedBy(inflationRate.plus(new BigNumber(1)))
    .decimalPlaces(0, BigNumber.ROUND_DOWN);

  const developmentFundTake = new BigNumber(
    (await api.query.rewards.developmentFundTake()).toString()
  ).div(PERBILL_DIVIDED_NUMBER);
  const developmentFundPayout = totalPayout
    .times(developmentFundTake)
    .decimalPlaces(0, BigNumber.ROUND_DOWN);
  let validatorPayout = totalPayout.minus(developmentFundPayout);
  validatorPayout = validatorPayout.isPositive()
    ? validatorPayout
    : new BigNumber(0);

  const validators = await api.query.session.validators();
  const validatorCount = new BigNumber(validators.length);
  const perValidatorPayout = validatorCount.isZero()
    ? new BigNumber(0)
    : validatorPayout
        .div(validatorCount)
        .decimalPlaces(0, BigNumber.ROUND_DOWN);

  // calculate_npos_payouts
  let validatorsCut = perValidatorPayout.times(commission);
  validatorsCut = validatorsCut.isGreaterThan(perValidatorPayout)
    ? perValidatorPayout
    : validatorsCut;

  const nominatorsCut = perValidatorPayout.minus(validatorsCut);

  if (nominatorsCut.isZero()) {
    // There's nothing left after validator has taken it's commission
    // only the validator gets a payout.
    return new BigNumber(0);
  }

  const nominatorPayout = nominatorsCut
    .times(stakeShare)
    .decimalPlaces(0, BigNumber.ROUND_DOWN);

  return nominatorPayout;
}

export async function getStakeShare(
  nominateToAddress: string,
  stashAccountAddress: string,
  api: ApiPromise
): Promise<{ stakeShare: BigNumber; elected: boolean }> {
  const stakers = (await api.query.staking.stakers(
    nominateToAddress
  )) as Exposure;
  const totalStakeAmount = new BigNumber(stakers.total.toString());
  const stakersWithStashAccount = stakers.others.find(
    other => other.who.toString() === stashAccountAddress
  );
  if (!stakersWithStashAccount) {
    return {
      stakeShare: new BigNumber(0),
      elected: false
    };
  }
  const stashAccountStakeAmount = new BigNumber(
    stakersWithStashAccount.value.toString()
  );

  return {
    stakeShare: stashAccountStakeAmount.div(totalStakeAmount),
    elected: true
  };
}
