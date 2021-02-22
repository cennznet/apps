// Copyright 2017-2021 @cennznet/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Api } from '@cennznet/api';
import { Option, StakingLedger } from '@cennznet/types';
import {
  SPENDING_ASSET_NAME, STAKING_ASSET_NAME
} from '@polkadot/app-generic-asset/assetsRegistry';
import FormatBalance from '@polkadot/app-generic-asset/FormatBalance';
import { AddressSmall, Button, LabelHelp } from '@polkadot/react-components';
import { useApi, useToggle } from '@polkadot/react-hooks';
import { BigNumber } from "bignumber.js";
import React, { useEffect, useState } from 'react';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import ManageStake from '../ManageStake';
import { useTranslation } from '../translate';
import { STAKE_SHARE_DISPLAY_DECIMAL_PLACE } from './config';
import { Nomination } from './index';
import { getNextRewardEstimate, getNominations, StakePair } from './utils';

interface Props {
    stakePair: StakePair;
}

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

export default function StakeInfo({ stakePair }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [isSettingsOpen, toggleSettings] = useToggle();
  const [nominations, setNominations] = useState<Nomination[]>();
  const [rewardAddress, setRewardAddress] = useState<string>();
  const [stakedAmount, setStakedAmount] = useState<BigNumber>(new BigNumber(0));
  const [rewardEstimate, setRewardEstimate] = useState<BigNumber>(new BigNumber(0));
  const { api } = useApi();

  useEffect(() => {
    api.query.rewards.payee(stakePair.stashAddress).then(
      (address: any) => setRewardAddress(address.toString())
    );
  }, []);

  useEffect(() => {
    getNextRewardEstimate(stakePair.stashAddress, api as Api).then(
      (amount: any) => setRewardEstimate(new BigNumber(amount))
    );
  }, []);

  useEffect(() => {
    api.query.staking.ledger(stakePair.controllerAddress).then((ledger: Option<StakingLedger>) => {
      const ledger_ = ledger.unwrapOrDefault();
      setStakedAmount(ledger_.total as any);
    });
  }, []);

  useEffect(() => {
    getNominations(stakePair.stashAddress, api as Api).then((nominations) => setNominations(nominations));
  }, []);

    return (
      <tbody
        className='tbody-container'
        key={`${stakePair.stashAddress}-${stakePair.controllerAddress}`}
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
                'Controls staking preferences for the stash. Requires CPAY for transactions fees only'
              )}
            />
          </th>
          <th>{t('Staked')}</th>
          <th>
            {t('Reward Destination')}
            <LabelHelp help={t('Account to receive rewards payouts')} />
          </th>
        </tr>
        <tr>
          <td className='address'>
            <AddressSmall value={stakePair.stashAddress} />
          </td>
          <td className='address'>
            <AddressSmall value={stakePair.controllerAddress} />
          </td>
          <td>
            <FormatBalance
              value={stakedAmount?.toString()}
              symbol={STAKING_ASSET_NAME}
            />
          </td>
          <td className='address'>
            <AddressSmall value={rewardAddress}/>
            <Button
              style={{ marginLeft: "auto" }}
              icon='setting'
              key='settings'
              onClick={toggleSettings}
              size='small'
              tooltip={t('Manage preferences for this staked account')}
            />
          </td>
        </tr>
        {isSettingsOpen && <ManageStake
          key='modal-transfer'
          stashAddress={stakePair.stashAddress}
          controllerAddress={stakePair.controllerAddress}
          onClose={toggleSettings}
        />}
        {nominations?.length === 0 ? (
          <tr />
        ) : (
          <tr className="nomination-header">
            <th className='header-secondary'>
              {t('Nominating')}
              <LabelHelp
                help={t('Validator accounts nominated by you')}
              />
            </th>
            <th className='header-secondary'>
              {t('Stake share')}
              <LabelHelp
                help={t('Your contribution of the validator\'s total stake')}
              />
            </th>
            <th className='header-secondary'>
              {t('Status')}
              <LabelHelp
                help={t('Whether the nomination is active now or waiting be applied in the next election')}
              />
            </th>
            <th className='header-secondary'>
              {t('Estimated reward')}
              <LabelHelp
                help={t('Expected total payout at the end of this era')}
              />
            </th>
          </tr>
        )}
        {nominations?.map((nominee: Nomination, index: number) => (
          <tr className='nomination-info' key={index}>
            <td><AddressSmall value={nominee.nominateToAddress}/></td>
            <td>{_renderStakeShare(nominee.stakeShare)}</td>
            <td>{nominee.elected ? '🟢' : '🟡'}</td>
            <td>
              <FormatBalance
                value={rewardEstimate.multipliedBy(nominee.stakeRaw.div(stakedAmount)).toString()}
                symbol={SPENDING_ASSET_NAME}
              />
            </td>
          </tr>
        ))}
        </tbody>
  );
}