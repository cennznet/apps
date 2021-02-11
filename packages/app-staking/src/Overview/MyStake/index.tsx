// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { AddressSmall, Table } from '@polkadot/react-components';
import { useAccounts, useApi } from '@polkadot/react-hooks';
import FormatBalance from '@polkadot/app-generic-asset/FormatBalance';
import {
  STAKING_ASSET_NAME,
  SPENDING_ASSET_NAME
} from '@polkadot/app-generic-asset/assetsRegistry';
import { BigNumber } from "bignumber.js";
import { LabelHelp } from '@polkadot/react-components';
import BN from 'bn.js';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import Loader from 'react-loader-spinner';

import { useTranslation } from '../../translate';
import { getStakes } from './utils';
import { STAKE_SHARE_DISPLAY_DECIMAL_PLACE } from './config';

export interface Stake {
  stashAccountAddress: string;
  controllerAccountAddress: string;
  stakeAmount: BN;
  rewardDestinationsAddress: string;
  nominates: Nominate[];
}

export interface Nominate {
  nominateToAddress: string;
  stakeShare: BigNumber;
  commission: BigNumber;
  nextRewardEstimate: BigNumber;
  elected: boolean;
}

interface Props {
  className?: string;
}

function MyStake({ className = '' }: Props): React.ReactElement<Props> {
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [isDiaplySpinner, setIsDiaplySpinner] = useState<boolean>(true);

  const [setStakesCount, setSetStakesCount] = useState<number>(0); // The number of unfinished setStakes calls

  const { t } = useTranslation();
  const { api } = useApi();
  const { allAccounts } = useAccounts();

  useEffect(() => {
    setIsDiaplySpinner(true);
    setSetStakesCount(setStakesCount + 1);
    getStakes(api, allAccounts).then(stakes => {
      setSetStakesCount(setStakesCount - 1);
      setStakes(stakes);
    });
  }, [allAccounts]);

  useEffect(() => {
    if (setStakesCount <= 0) {
      setIsDiaplySpinner(false);
    } else {
      setIsDiaplySpinner(true);
    }
  }, [setStakesCount]);

  const _renderStakeShare = (stakeShare: BigNumber) => {
    /* times(100) to convert to percentage */
    if (stakeShare.isZero()) {
      return <div>{`0%`}</div>;
    }
    const percentage = stakeShare
      .times(100)
      .toFixed(STAKE_SHARE_DISPLAY_DECIMAL_PLACE, 1); // 1 means round down. eg: 1. (new BigNumber(0.0001)).toFixed(3, 1) = '0.000'; 2.(new BigNumber(0.0009)).toFixed(3, 1) = '0.000'; 3.(new BigNumber(0.001)).toFixed(3, 1) = '0.001';
    if (percentage === '0.000') {
      // stakeShare less than (1 * 10pow(-STAKE_SHARE_DISPLAY_DECIMAL_PLACE) %)
      return (
        <div>{`< ${Math.pow(10, -STAKE_SHARE_DISPLAY_DECIMAL_PLACE)}%`}</div>
      );
    }
    return (
      <div>{`${stakeShare
        .times(100)
        .toFixed(STAKE_SHARE_DISPLAY_DECIMAL_PLACE)}%`}</div>
    );
  };

  const _renderStakes = useCallback(
    (stakes: Stake[]) => {
      return stakes.map(stake => {
        return (
          <tbody
            className='tbody-container'
            key={`${stake.stashAccountAddress}-${stake.controllerAccountAddress}`}
          >
            <tr>
              <th data-for='stash-trigger'>
                {t('Stash')}
                <LabelHelp
                  help={t('Primary account holding CENNZ at stake (aka stash)')}
                />
              </th>
              <th>
                {t('Controller')}
                <LabelHelp
                  help={t(
                    'Controls staking preferences for the stash. Requires Cpay for transactions fees only'
                  )}
                />
              </th>
              <th>{t('Amount')}</th>
              <th>
                {t('Reward Destination')}
                <LabelHelp help={t('Account to receive rewards payouts')} />
              </th>
            </tr>
            <tr>
              <td className='address'>
                <AddressSmall value={stake.stashAccountAddress} />
              </td>
              <td className='address'>
                <AddressSmall value={stake.controllerAccountAddress} />
              </td>
              <td>
                <FormatBalance
                  value={stake.stakeAmount}
                  symbol={STAKING_ASSET_NAME}
                />
              </td>
              <td className='address'>
                <AddressSmall value={stake.rewardDestinationsAddress} />
              </td>
            </tr>
            {stake.nominates.length === 0 ? (
              <tr />
            ) : (
              <tr>
                <th>{t('Nominating')}</th>
                <th>{t('Stake share')}</th>
                <th>{t('Next reward estimate')}</th>
                <th>{t('Elected')}</th>
              </tr>
            )}
            {stake.nominates.map((nominate, index) => (
              <tr
                className={index === 0 ? '' : 'staking-MyStake-Nomination'}
                key={`${stake.stashAccountAddress}-${stake.controllerAccountAddress}-${nominate.nominateToAddress}`}
              >
                <td>
                  <AddressSmall value={nominate.nominateToAddress} />
                </td>
                <td>{_renderStakeShare(nominate.stakeShare)}</td>
                <td>
                  <FormatBalance
                    value={new BN(nominate.nextRewardEstimate.toFixed())}
                    symbol={SPENDING_ASSET_NAME}
                  />
                </td>
                <td>{`${nominate.elected}`}</td>
              </tr>
            ))}
          </tbody>
        );
      });
    },
    [stakes]
  );

  const _renderSpinner = () => (
    <StyledLoader>
      <Loader
        type='TailSpin'
        color='#1E2022'
        height={100}
        width={100}
        timeout={-1} //3 secs
      />
    </StyledLoader>
  );

  return (
    <div className={`staking--Overview--MyStake ${className}`}>
      {isDiaplySpinner ? (
        _renderSpinner()
      ) : (
        <StyledTable className='staking--Overview--MyStake-Table'>
          {_renderStakes(stakes)}
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
