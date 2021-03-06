// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';

import type { Inflation } from '@polkadot/react-hooks/types';
import type { AccountId, Balance, BlockNumber, EraIndex, Exposure, Hash, SessionIndex, ValidatorPrefs, ValidatorPrefsTo196 } from '@polkadot/types/interfaces';

export type Nominators = Record<string, string[]>;

export type AccountFilter = 'all' | 'controller' | 'session' | 'stash' | 'unbonded';

export type ValidatorFilter = 'all' | 'hasNominators' | 'noNominators' | 'hasWarnings' | 'noWarnings' | 'iNominated' | 'nextSet';

export interface NominatedBy {
  index: number;
  nominatorId: string;
  submittedIn: EraIndex;
}

export interface Slash {
  accountId: AccountId;
  amount: Balance;
}

export interface SessionRewards {
  blockHash: Hash;
  blockNumber: BlockNumber;
  isEventsEmpty: boolean;
  parentHash: Hash;
  reward: Balance;
  sessionIndex: SessionIndex;
  slashes: Slash[];
  treasury: Balance;
}

interface ValidatorInfoRank {
  rankBondOther: number;
  rankBondOwn: number;
  rankBondTotal: number;
  rankComm: number;
  rankNumNominators: number;
  rankOverall: number;
  rankPayment: number;
  rankReward: number;
}

export interface ValidatorInfo extends ValidatorInfoRank {
  accountId: AccountId;
  bondOther: BN;
  bondOwn: Balance;
  bondShare: number;
  bondTotal: Balance;
  commissionPer: number;
  exposure: Exposure;
  isActive: boolean;
  isCommission: boolean;
  isElected: boolean;
  isFavorite: boolean;
  isNominating: boolean;
  key: string;
  knownLength: BN;
  lastPayout?: BN;
  numNominators: number;
  numRecentPayouts: number;
  rewardSplit: BN;
  skipRewards: boolean;
  stakedReturn: number;
  stakedReturnCmp: number;
  validatorPayment: BN;
  validatorPrefs?: ValidatorPrefs | ValidatorPrefsTo196;
}

export type TargetSortBy = keyof ValidatorInfoRank;

export interface SortedTargets {
  avgStaked?: BN;
  inflation: Inflation;
  lastReward?: BN;
  lowStaked?: BN;
  medianComm: number;
  nominators?: string[];
  totalStaked?: BN;
  totalIssuance?: BN;
  validators?: ValidatorInfo[];
  validatorIds?: string[];
}
