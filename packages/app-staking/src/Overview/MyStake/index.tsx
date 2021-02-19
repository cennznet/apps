// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Table } from '@polkadot/react-components';
import { useAccounts, useApi } from '@polkadot/react-hooks';
import { BigNumber } from "bignumber.js";
import BN from 'bn.js';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import Loader from 'react-loader-spinner';

import { findStakedAccounts, getStakes, StakePair } from './utils';
import { Api } from '@cennznet/api';
import StakeInfo from './StakeInfo';

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
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [isDisplaySpinner, setIsDisplaySpinner] = useState<boolean>(true);
  const [setStakesCount, setSetStakesCount] = useState<number>(0); // The number of unfinished setStakes calls
  const [stakedAccounts, setStakedAccounts] = useState<Map<string, StakePair>>();

  const { api } = useApi();
  const { allAccounts } = useAccounts();

  useEffect(() => {
    findStakedAccounts(api as Api, allAccounts).then((stakePairs: Map<string, StakePair>) => {
      setStakedAccounts(stakePairs);
    });
  }, [allAccounts]);

  useEffect(() => {
    setIsDisplaySpinner(true);
    setSetStakesCount(setStakesCount + 1);

    getStakes(api as Api, allAccounts).then(stakes => {
      setSetStakesCount(setStakesCount - 1);
      setStakes(stakes);
    });
  }, [allAccounts]);

  useEffect(() => {
    if (setStakesCount <= 0) {
      setIsDisplaySpinner(false);
    } else {
      setIsDisplaySpinner(true);
    }
  }, [stakes]);

  const _renderSpinner = () => (
    <StyledLoader>
      <Loader
        type='TailSpin'
        color='#1E2022'
        height={100}
        width={100}
        timeout={-1} // 3 secs
      />
    </StyledLoader>
  );

  return (
    <div className={`staking--Overview--MyStake ${className}`}>
      {isDisplaySpinner ? (
        _renderSpinner()
      ) : (
        <StyledTable className='staking--Overview--MyStake-Table'>
          {
           Array.from((stakedAccounts?.values()) || []).map((stakePair, index) => {
             return (<StakeInfo key={index} stakePair={stakePair}/>)
           })
          }
        </StyledTable>
      )}
    </div>
  );
}

export default MyStake;

const StyledLoader = styled.div`
  &:nth-child(1) {
    margin: auto;
    margin-top: 100px;
    width: 100px;
  }
`;

const StyledTable = styled(Table)`
  font-size: 15px;

  table {
    display: block;
    width: 100%;
    border-collapse: collapse;
  }

  tbody-container {
    display: block;
    width: 100%;
  }

  tbody {
    display: block;
    width: 100%;
  }

  tr {
    display: flex;
    width: 100%;
  }

  th {
    background: #fafafa !important;
    color: rgba(78, 78, 78, 0.66) !important;
    text-align: left !important;
    flex: 1;
  }

  td {
    flex: 1;
    display: flex;
    align-items: center;
  }

  td:first-child {
    border-top-left-radius: 10px !important;
    border-bottom-left-radius: 10px !important;
  }

  td:last-child {
    border-top-right-radius: 10px !important;
    border-bottom-right-radius: 10px !important;
  }

  .tbody-container {
    background-color: white;
    border: 1px solid #f2f2f2;
    border-radius: 10px;
    padding: 1rem;
    padding-top: 0.5rem;
    margin: 0.75rem 0;

    th {
      background: white !important;
    }
    td {
      background: #fafafa !important;
    }

    .staking-MyStake-Nomination {
      padding-top: 1rem;
    }
  }
`;
