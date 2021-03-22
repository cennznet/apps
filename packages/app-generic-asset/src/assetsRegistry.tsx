// Copyright 2019 @polkadot/app-generic-asset authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { BehaviorSubject } from 'rxjs';
import { defaultReservedAssets } from '@polkadot/app-generic-asset/asset-util';
import { useApi, useStorageKey, useCall } from '@polkadot/react-hooks';

const ASSETS_KEY = "cennznet-assets";
export const STAKING_ASSET_NAME = "CENNZ";
export const SPENDING_ASSET_NAME = "CPAY";

export interface AssetInfo {
  symbol: string;
  decimals: number;
}

export interface AssetsSubjectInfo { [id: string]: AssetInfo }
let _initializedAssetRegistry: AssetRegistry | undefined;

export class AssetRegistry {
  subject!: BehaviorSubject<AssetsSubjectInfo>;

  // needs Api context
  constructor() {
    // singleton
    if(_initializedAssetRegistry !== undefined) return _initializedAssetRegistry;

    const [getStoredAssets, setStoredAssets] = useStorageKey<string>(undefined, ASSETS_KEY);

    let initialAssets: AssetsSubjectInfo = {};

    try {
      initialAssets = JSON.parse(getStoredAssets()!);
    } catch (e) {
      console.warn('no cached assets registered');
    }

    this.subject = new BehaviorSubject(initialAssets);
    this.subject.subscribe({ 
      next: (assets: AssetsSubjectInfo) => setStoredAssets(JSON.stringify(assets))
    });

    _initializedAssetRegistry = this;
  }

  getSpendingAssetId(): string {
    for (let [id, { symbol }] of Object.entries(this.subject.getValue())) {
      if (symbol === SPENDING_ASSET_NAME) return id
    }
    // fallback, re-query the value
    const { api } = useApi();
    return useCall<string>(api.query.genericAsset.spendingAssetId, [])!
  }

  getStakingAssetId(): string {
    for (let [id, { symbol } ] of Object.entries(this.subject.getValue())) {
      if (symbol === STAKING_ASSET_NAME) return id
    }
    // fallback, re-query the value
    const { api } = useApi();
    return useCall<string>(api.query.genericAsset.stakingAssetId, [])!
  }

  // query asset in the registry
  get(targetId: string): AssetInfo | undefined {
    const { [targetId]: info } = this.subject.getValue();
    return info;
  }

  // get all assets in the registry
  getAssets(): Array<[string, {symbol: string, decimals: number}]> {
    return Object.entries(this.subject.getValue());
  }

  // add a new asset to the registry by Id
  add(id: string, symbol: string, decimals: number): void {
    const assets = this.subject.getValue();
    this.subject.next({
      ...assets,
      [id]: { symbol, decimals }
    });
  }

  // remove an asset from the registry
  remove(id: string): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [id]: ignore, ...assets } = this.subject.getValue();
    this.subject.next(assets);
  }
}
