// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Table } from '@polkadot/react-components';
import { useApi, useCacheKey } from '@polkadot/react-hooks';
import { BigNumber } from "bignumber.js";
import BN from 'bn.js';

import { findStakedAccounts, NominationState, StakePair, STORE_STAKES } from './utils';
import { Api } from '@cennznet/api';
import StakeInfo from './StakeInfo';
import { colors } from '../../../../styled-theming';

export interface Stake {
  stashAddress: string;
  controllerAddress: string;
  stakeAmount: BN;
  rewardAddress: string;
  // the validator stash addresses this account has nominated
  nominations: Nomination[];
  // the total reward estimate accrued
  nextRewardEstimate: BigNumber;
}

export interface Nomination {
  nominateToAddress: string;
  // the % of stake behind this nominator vs. it's total
  stakeShare: BigNumber;
  // the raw stake contributed to this nomination
  stakeRaw: BigNumber;
  // the state of the nomination this era
  state: NominationState;
}

interface Props {
  className?: string;
  accounts: string[];
}

function MyStake({ accounts, className = '' }: Props): React.ReactElement<Props> {
  const { api } = useApi();

  // use cache to load staked accounts
  const [getCache, setCache] = useCacheKey<string>(STORE_STAKES);
  var stakedAccounts_: Array<[string, StakePair]>;
  try {
    stakedAccounts_ = JSON.parse(getCache()!); 
  } catch (err) {
    stakedAccounts_ = new Array();
  }
  const [stakedAccounts, setStakedAccounts] = useState<Array<[string, StakePair]>>(stakedAccounts_);

  useEffect(() => {
    findStakedAccounts(api as Api, accounts).then((staked: Map<string, StakePair>) => {
      setStakedAccounts(Array.from(staked.entries()));
      setCache(JSON.stringify(Array.from(staked.entries())));
    });
  }, [accounts]);

  return (
    <div className={`staking--Overview--MyStake ${className}`}>
      <StyledTable className='staking--Overview--MyStake-Table'>
        {
          stakedAccounts.map(([_key, stakePair], index) => {
            return (<StakeInfo key={index} stakePair={stakePair}/>)
          })
        }
      </StyledTable>
    </div>
  );
}

export default MyStake;

const StyledTable = styled(Table)`
  font-size: 15px;

  table {
    border-collapse: collapse;
    max-width: 1000px;
  }

  tbody {
    display: block;
    width: 100%;
  }

  tr {
    display: flex;
  }

  th {
    text-align: left !important;
    background: ${colors.primary} !important;
    flex: 1;
    margin-top: 1rem;
  }

  td {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .header-secondary {
    background: ${colors.N400} !important;
  }

  .nomination-header,
  .nomination-info,
  .unlocking-header,
  .unlocking-info {
    margin-left: 1.5em;
  }

  .unlocking-header,
  .unlocking-info {
    max-width: 350px;
  }
`;
