// Copyright 2017-2020 @polkadot/react-api authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SubmittableExtrinsicFunction } from '@polkadot/api/promise/types';

import { ApiPromise } from '@polkadot/api';
import { KeyringPair$JsonEncodingTypes, KeyringPair$JsonVersion, KeyringPair$Meta } from '@polkadot/keyring/types';
import { KeypairType } from '@polkadot/util-crypto/types';

// helpers for HOC props
export type OmitProps<T, K> = Pick<T, Exclude<keyof T, K>>;
export type SubtractProps<T, K> = OmitProps<T, keyof K>;

export interface BareProps {
  className?: string;
  style?: Record<string, any>;
}

export interface ApiState {
  apiDefaultTx: SubmittableExtrinsicFunction;
  apiDefaultTxSudo: SubmittableExtrinsicFunction;
  isApiReady: boolean;
  isDevelopment: boolean;
  isSubstrateV2: boolean;
  systemChain: string;
  systemName: string;
  systemVersion: string;
}

export interface ApiProps extends ApiState {
  api: ApiPromise;
  isWaitingInjected: boolean;
  isApiConnected: boolean;
}

export interface OnChangeCbObs {
  next: (value?: any) => any;
}

export type OnChangeCbFn = (value?: any) => any;
export type OnChangeCb = OnChangeCbObs | OnChangeCbFn;

export interface ChangeProps {
  callOnResult?: OnChangeCb;
}

export interface CallState {
  callResult?: any;
  callUpdated?: boolean;
  callUpdatedAt?: number;
}

export type CallProps = ApiProps & CallState;

export type BaseProps<T> = BareProps & CallProps & ChangeProps & {
  children?: React.ReactNode;
  label?: string;
  render?: (value?: T) => React.ReactNode;
};

export type Formatter = (value?: any) => string;

export interface KeyringPair$JsonEncoding2 {
  content: ['pkcs8', {'type': KeypairType} ];
  type: KeyringPair$JsonEncodingTypes | KeyringPair$JsonEncodingTypes[];
  version: KeyringPair$JsonVersion;
}
export interface KeyringPair$Json2 {
  address: string;
  encoded: string;
  encoding: KeyringPair$JsonEncoding2;
  meta: KeyringPair$Meta;
}