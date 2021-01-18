// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';
import React, { useMemo } from 'react';

import type { ValidatorPrefs } from '@polkadot/types/interfaces';
import { AddressSmall } from '@polkadot/react-components';
import { useApi, useCall } from '@polkadot/react-hooks';
import FormatBalance from '@polkadot/app-generic-asset/FormatBalance';
import type { NominatedBy as NominatedByType, ValidatorInfo } from '../../types';
import type { NominatorValue } from './types';
import Status from './Status';
import { poolRegistry } from "@polkadot/app-staking/Overview/Address/poolRegistry";
import { STAKING_ASSET_NAME } from "@polkadot/app-generic-asset/assetsRegistry";

interface Props {
  address: string;
  className?: string;
  filterName: string;
  hasQueries: boolean;
  isElected: boolean;
  isFavorite: boolean;
  isMain?: boolean;
  lastBlock?: string;
  nominatedBy?: NominatedByType[];
  onlineCount?: false | BN;
  onlineMessage?: boolean;
  points?: string;
  toggleFavorite: (accountId: string) => void;
  validatorInfo?: ValidatorInfo;
  withIdentity: boolean;
}

interface StakingState {
  commission?: string;
  nominators: NominatorValue[];
  stakeTotal?: BN;
  stakeOther?: BN;
  stakeOwn?: BN;
}

function expandInfo ({ exposure, validatorPrefs }: ValidatorInfo): StakingState {
  let nominators: NominatorValue[] = [];
  let stakeTotal: BN | undefined;
  let stakeOther: BN | undefined;
  let stakeOwn: BN | undefined;

  if (exposure) {
    nominators = exposure.others.map(({ value, who }) => ({ nominatorId: who.toString(), value: value.unwrap() }));
    stakeTotal = exposure.total.unwrap();
    stakeOwn = exposure.own.unwrap();
    stakeOther = stakeTotal.sub(stakeOwn);
  }

  const commission = (validatorPrefs as ValidatorPrefs)?.commission?.unwrap();

  return {
    commission: commission?.toHuman(),
    nominators,
    stakeOther,
    stakeOwn,
    stakeTotal
  };
}

function Address ({ address, className = '', filterName, hasQueries, isElected, isFavorite, isMain, lastBlock, nominatedBy, onlineCount, onlineMessage, points, toggleFavorite, validatorInfo, withIdentity }: Props): React.ReactElement<Props> | null {
  const { api } = useApi();
  const { nominators, stakeTotal } = useMemo(
    () => validatorInfo
      ? expandInfo(validatorInfo)
      : { nominators: [] },
    [validatorInfo]
  );

  const chainInfo = useCall<string>(api.rpc.system.chain, []);
  const chain: string | undefined = chainInfo ? chainInfo.toString() : undefined;
  const pool = chain ? poolRegistry[chain][address] ? poolRegistry[chain][address] : 'unknown' : 'unknown';

  return (
      <tr className={className}>
           <td className='address'>
               <AddressSmall value={address} />
           </td>
          <td className='address'>
              {pool}
          </td>
          <td className='badge together'>
              <Status
                  isElected={isElected}
                  isMain={isMain}
                  nominators={isMain ? nominators : nominatedBy}
                  onlineCount={onlineCount}
                  onlineMessage={onlineMessage}
              />
          </td>
          {isMain && (
              <td style={{width:'15%', whiteSpace:'nowrap'}}>
                {stakeTotal?.gtn(0) && (
                  <FormatBalance value={stakeTotal} symbol={STAKING_ASSET_NAME}/>
                )}
              </td>
          )}
      </tr>
  );
}

export default React.memo(Address);
