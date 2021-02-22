import { Nominations, Exposure } from '@cennznet/types';
import { Api as ApiPromise } from '@cennznet/api';
import { BigNumber } from 'bignumber.js';

import { Nomination } from './index';

export const STORE_STAKES: string = 'accounts:staking';

export interface StakePair {
  stashAddress: string;
  controllerAddress: string;
}

// Return a list of all stash, controller pairs associated with the given (local) addresses
export async function findStakedAccounts(
  api: ApiPromise,
  addresses: string[]
): Promise<Map<string, StakePair>> {
  const stakePairs: Map<string, StakePair> = new Map();

  // Key is `stashAddress-controllerAddress`, use map to deduplicate
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

// Get the nominated validator stash addresses for stashAddress
export async function getNominations(
  stashAddress: string,
  api: ApiPromise
): Promise<Nomination[]> {
  const nominations: Nomination[] = [];
  const nominationsOption = await api.query.staking.nominators(stashAddress);
  if (nominationsOption.isNone) {
    return [];
  }
  const nominations_ = nominationsOption.unwrapOrDefault() as Nominations;
  const nominated =
    nominations_ && nominations_.targets
      ? (nominations_.targets.toJSON() as string[])
      : [];

  // For each nominator calculate the stashes share of stake
  await Promise.all(
    nominated.map(
      async nominateToAddress =>
        new Promise<void>(async resolve => {

          const { stakeShare, stakeRaw, elected } = await getStakeShare(
            nominateToAddress,
            stashAddress,
            api
          );

          nominations.push({
            nominateToAddress,
            stakeRaw,
            stakeShare,
            elected,
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
  stashAddress: String,
  api: ApiPromise,
): Promise<BigNumber> {
  // @ts-ignore
  return api.rpc.staking.accruedPayout(stashAddress);
}

// Return info on the stake contributed by [[stashAddress]] to [[nominatedAddress]]
export async function getStakeShare(
  nominatedAddress: string,
  stashAddress: string,
  api: ApiPromise
): Promise<{ stakeShare: BigNumber; stakeRaw: BigNumber; elected: boolean }> {
  const stakers = (await api.query.staking.stakers(nominatedAddress)) as Exposure;
  const totalStakeAmount = new BigNumber(stakers.total.toString());
  const stakersWithStashAccount = stakers.others.find(
    other => other.who.toString() === stashAddress
  );
  if (!stakersWithStashAccount) {
    return {
      stakeShare: new BigNumber(0),
      stakeRaw: new BigNumber(0),
      elected: false
    };
  }
  const stashAccountStakeAmount = new BigNumber(stakersWithStashAccount.value.toString());

  return {
    stakeRaw: stashAccountStakeAmount,
    stakeShare: stashAccountStakeAmount.div(totalStakeAmount),
    elected: true
  };
}