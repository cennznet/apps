// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Table } from '@polkadot/react-components';
import { useAccounts, useApi } from '@polkadot/react-hooks';
import { BigNumber } from "bignumber.js";
import BN from 'bn.js';

import { findStakedAccounts, StakePair } from './utils';
import { Api } from '@cennznet/api';
import StakeInfo from './StakeInfo';
import { colors } from '../../../../../styled-theming';

export interface Stake {
  stashAddress: string;
  controllerAddress: string;
  stakeAmount: BN;
  rewardAddress: string;
  // the validator stash addresses this account has nominated
  nominations: Nomination[];
}

export interface Nomination {
  nominateToAddress: string;
  stakeShare: BigNumber;
  nextRewardEstimate: BigNumber;
  // whether the nominated validator is elected this era or not
  elected: boolean;
}

interface Props {
  className?: string;
}

function MyStake({ className = '' }: Props): React.ReactElement<Props> {
  const [stakedAccounts, setStakedAccounts] = useState<Map<string, StakePair>>();

  const { api } = useApi();
  const { allAccounts } = useAccounts();

  useEffect(() => {
    findStakedAccounts(api as Api, allAccounts).then((stakePairs: Map<string, StakePair>) => {
      setStakedAccounts(stakePairs);
    });
  }, [allAccounts]);

  return (
    <div className={`staking--Overview--MyStake ${className}`}>
      <StyledTable className='staking--Overview--MyStake-Table'>
        {
          Array.from((stakedAccounts?.values()) || []).map((stakePair, index) => {
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

  .nominations-container {
    margin-left: 1.5em;
  }
`;
