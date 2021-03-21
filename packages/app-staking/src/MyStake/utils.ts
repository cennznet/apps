import { Nominations, Exposure, EraIndex } from '@cennznet/types';
import { Api as ApiPromise } from '@cennznet/api';
import { BigNumber } from 'bignumber.js';

import { Nomination } from './index';

export const STORE_STAKES: string = 'accounts:staking';
export const ERA_EXPOSURE: string = 'era:exposure';

export interface StakePair {
  stashAddress: string;
  controllerAddress: string;
}

export enum NominationState {
  // The nomination is active and staked
  ActiveStaked,
  // The nomination is active but stake has been reallocated this era
  ActiveReallocated,
  // The nomination is active but the stake will not be rewarded
  ActiveOversubscribed,
  // The nomination will be considered in future eras
  Pending,
}

let exposures: Map<string, Exposure> = new Map();
let exposuresClipped: Map<string, Exposure> = new Map();

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
export async function getNominationDetails(
  nominatedStashes: Nominations,
  stashAddress: string,
  api: ApiPromise,
  eraIndex: EraIndex,
): Promise<Nomination[]> {
  const nominations: Nomination[] = [];
  const nominated =
    nominatedStashes && nominatedStashes.targets
      ? (nominatedStashes.targets.toJSON() as string[])
      : [];
  const submittedEraIndex = nominatedStashes.submittedIn;

  // For each nominator calculate the stashes share of stake
  await Promise.all(
    nominated.map(
      async nominateToAddress =>
        new Promise<void>(async resolve => {

          const { stakeShare, stakeRaw, state } = await getStakeShare(
            eraIndex,
            submittedEraIndex,
            nominateToAddress,
            stashAddress,
            api
          );
          nominations.push({
            nominateToAddress,
            stakeRaw,
            stakeShare,
            state,
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
  eraIndex: EraIndex,
  submittedEraIndex: EraIndex,
  nominatedAddress: string,
  stashAddress: string,
  api: ApiPromise
): Promise<{ stakeShare: BigNumber; stakeRaw: BigNumber; state: NominationState }> {
  // TODO: cache these exposures
  const stakers = exposures.get(nominatedAddress) || (await api.query.staking.erasStakers(eraIndex, nominatedAddress)) as Exposure;
  exposures.set(nominatedAddress, stakers);

  const totalStakeAmount = new BigNumber(stakers.total.toString());

  // unclipped
  const exposure = stakers.others.find(
    other => other.who.toString() === stashAddress
  );

  if (!exposure) {
    // nominator is not exposed, it may have been reallocated OR the nomination will apply in the next era
    return {
      stakeShare: new BigNumber(0),
      stakeRaw: new BigNumber(0),
      state: submittedEraIndex.toNumber() == eraIndex.toNumber() ? NominationState.Pending : NominationState.ActiveReallocated,
    }
  }

  const stakersClipped = exposuresClipped.get(nominatedAddress) || (await api.query.staking.erasStakersClipped(eraIndex, nominatedAddress)) as Exposure;
  exposuresClipped.set(nominatedAddress, stakersClipped);

  // clipped
  const exposureClipped = stakersClipped.others.find(
    other => other.who.toString() === stashAddress
  );
  const stashAccountStakeAmount = new BigNumber(exposure.value.toString());

  return {
    stakeRaw: stashAccountStakeAmount,
    stakeShare: stashAccountStakeAmount.div(totalStakeAmount),
    // this nomination is outside of the rewarded nominators set
    state: exposureClipped ? NominationState.ActiveStaked : NominationState.ActiveOversubscribed,
  };
}
