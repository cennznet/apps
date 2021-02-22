import { Nominations, StakingLedger, Exposure } from '@cennznet/types';
import { Api as ApiPromise } from '@cennznet/api';
import { BigNumber } from "bignumber.js";
import BN from 'bn.js';

import { Nomination, Stake } from './index';

export interface StakePair {
  stashAddress: string;
  controllerAddress: string;
}

// find staked addresses
// render a component for each with defaults
// add useState + useEffects to update async on StakeInfo

// Return a list of all stash, controller pairs associated with the given addresses
export async function findStakedAccounts(
  api: ApiPromise,
  addresses: string[]
): Promise<Map<string, StakePair>> {
  // Key is `stashAddress-controllerAddress`, use map to deduplicate
  let stakePairs: Map<string, StakePair> = new Map();;

  await Promise.all(addresses.map(
    address =>
      new Promise<void>(async resolve => {
        const controllerAddress = await getControllerByStash(address, api);
        if (controllerAddress !== null) {
          stakePairs.set(`${address}-${controllerAddress}`, {
            stashAddress: address,
            controllerAddress: controllerAddress
          });
        }

        const stashAddress = await getStashByController(address, api);
        if (stashAddress !== null) {
          stakePairs.set(`${stashAddress}-${address}`, {
            stashAddress: stashAddress,
            controllerAddress: address
          });
        }

        resolve();
      })
  ));

  return stakePairs;
}

export async function getStakes(
  api: ApiPromise,
  addresses: string[]
): Promise<Stake[]> {
  const stakeAccountPairMap: Record<
    string,
    {
      stashAddress: string;
      controllerAddress: string;
    }
  > = {}; // Key is `stashAddress-controllerAddress`, use map for deduplicate
  const stakes = await Promise.all(
    Object.values(stakeAccountPairMap).map(
      accountPair =>
        new Promise<Stake>(async resolve => {
          const stake = await getStake(
            accountPair.stashAddress,
            accountPair.controllerAddress,
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
  const controllerAddressOption = await api.query.staking.bonded(
    address
  );

  if (controllerAddressOption.isNone) {
    return null;
  }

  return controllerAddressOption.toString();
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
  stashAddress: string,
  controllerAddress: string,
  api: ApiPromise
): Promise<Stake> {
  // Get staked amount and reward destination address
  const stakeLedger = (
    await api.query.staking.ledger(controllerAddress)
  ).unwrapOrDefault() as StakingLedger;
  const stakeAmount = new BN(stakeLedger.total.toString());
  const rewardAddress = (await api.query.rewards.payee(stashAddress)).toString();
  const nominations = await getNominations(stashAddress, api);

  return {
    stashAddress,
    controllerAddress,
    stakeAmount,
    rewardAddress,
    nominations
  };
}

// Get the nominated validator stash addresses for stashAddress
export async function getNominations(
  stashAddress: string,
  api: ApiPromise
): Promise<Nomination[]> {
  const nominations: Nomination[] = [];
  const nominationsOption = await api.query.staking.nominators(
    stashAddress
  );
  if (nominationsOption.isNone) {
    return [];
  }
  const nominations_ = nominationsOption.unwrapOrDefault() as Nominations;
  const nominateToAddresses =
    nominations_ && nominations_.targets
      ? (nominations_.targets.toJSON() as string[])
      : [];

  // Get reward estimate
  const nextRewardEstimate = await getNextRewardEstimate(
    api,
    stashAddress,
  );

  // For each nominator, get stakeShare, and nextRewardEstimate
  await Promise.all(
    nominateToAddresses.map(
      async nominateToAddress =>
        new Promise<void>(async resolve => {
          // Get stakeShare
          const { stakeShare, elected } = await getStakeShare(
            nominateToAddress,
            stashAddress,
            api
          );

          nominations.push({
            nominateToAddress,
            stakeShare,
            elected,
            nextRewardEstimate
          });

          resolve();
        })
    )
  );
  return nominations;
}

// Reference: https://github.com/cennznet/cennznet/wiki/Validator-Guide#rewards
// Reference 2: cennznet/crml/staking/src/rewars/mod.rs/fn enqueue_reward_payouts&calculate_npos_payouts
export async function getNextRewardEstimate(
  api: ApiPromise,
  stashAddress: String,
): Promise<BigNumber> {
  // @ts-ignore
  return api.rpc.staking.accruedPayout(stashAddress);
}

export async function getStakeShare(
  nominateToAddress: string,
  stashAddress: string,
  api: ApiPromise
): Promise<{ stakeShare: BigNumber; elected: boolean }> {
  const stakers = (await api.query.staking.stakers(
    nominateToAddress
  )) as Exposure;
  const totalStakeAmount = new BigNumber(stakers.total.toString());
  const stakersWithStashAccount = stakers.others.find(
    other => other.who.toString() === stashAddress
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
