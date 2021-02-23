// Copyright 2017-2021 @cennznet/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Api } from '@cennznet/api';
import {UnlockChunk} from '@polkadot/types/interfaces/staking/types';
import { AccountId, Nominations, Option, StakingLedger, u64 } from '@cennznet/types';
import {
  SPENDING_ASSET_NAME, STAKING_ASSET_NAME
} from '@polkadot/app-generic-asset/assetsRegistry';
import FormatBalance from '@polkadot/app-generic-asset/FormatBalance';
import { AddressSmall, Button, LabelHelp } from '@polkadot/react-components';
import { useApi, useCall, useToggle } from '@polkadot/react-hooks';
import { BigNumber } from "bignumber.js";
import React, { useEffect, useState } from 'react';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import ManageStake from '../ManageStake';
import { useTranslation } from '../translate';
import { STAKE_SHARE_DISPLAY_DECIMAL_PLACE } from './config';
import { Nomination } from './index';
import { getNextRewardEstimate, getNominationDetails, StakePair } from './utils';

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
  const { api } = useApi();
  const { t } = useTranslation();
  const [isSettingsOpen, toggleSettings] = useToggle();
  const [nominations, setNominations] = useState<Nomination[]>();
  const [rewardEstimate, setRewardEstimate] = useState<BigNumber>(new BigNumber(0));
  const [stakedAmount, setStakedAmount] = useState<BigNumber>(new BigNumber(0));
  const [totalStakedAmount, setTotalStakedAmount] = useState<BigNumber>(new BigNumber(0));
  const [unlocking, setUnlocking] = useState<UnlockChunk[]>([]);

  let controllerAddress = useCall<string>(api.query.staking.bonded, [stakePair.stashAddress])?.toString() || stakePair.controllerAddress;
  let rewardAddress = useCall<AccountId>(api.query.rewards.payee, [stakePair.stashAddress]);
  let ledger = useCall<Option<StakingLedger>>(api.query.staking.ledger, [controllerAddress]);
  let nominatedStashes = useCall<Option<Nominations>>(api.query.staking.nominators, [stakePair.stashAddress]);
  let currentEra = useCall<u64>(api.query.staking.currentEra, []);

  useEffect(() => {
    if(!ledger) return;

    const ledger_ = ledger.unwrapOrDefault();
    setStakedAmount(ledger_.active as any);
    setTotalStakedAmount(ledger_.total as any);
    setUnlocking(ledger_.unlocking);
  }, [ledger]);

  useEffect(() => {
    getNextRewardEstimate(stakePair.stashAddress, api as Api).then(
      (amount: any) => setRewardEstimate(new BigNumber(amount))
    );
  }, [nominatedStashes]);

  useEffect(() => {
    if(!nominatedStashes) return;

    getNominationDetails(nominatedStashes.unwrapOrDefault(), stakePair.stashAddress, api as Api)
      .then((nominations: Nomination[]) => setNominations(nominations));
  }, [nominatedStashes]);

    return (
      <tbody
        className='tbody-container'
        key={`${stakePair.stashAddress}-${controllerAddress}`}
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
          <th>
            {t('Staked')}
            <LabelHelp
                help={t('Active balance at stake (excludes unstaking amounts)')}
            />
          </th>
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
            <AddressSmall value={controllerAddress} />
          </td>
          <td>
            <FormatBalance
              value={stakedAmount.toString()}
              symbol={STAKING_ASSET_NAME}
            />
          </td>
          <td className='address'>
            {rewardAddress && <AddressSmall value={rewardAddress.toString()}/>}
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
          controllerAddress={controllerAddress}
          onClose={toggleSettings}
        />}
        {!nominations || nominations.length === 0 ? (
          <tr/>
        ) : (
          <tr className='nomination-header'>
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
                // assumes equal rewards to nominated validators
                value={rewardEstimate.multipliedBy(nominee.stakeRaw.div(stakedAmount)).toString()}
                symbol={SPENDING_ASSET_NAME}
              />
            </td>
          </tr>
        ))}
        {!unlocking || unlocking.length === 0 ? (
          <tr/>
        ) : (
          <tr className='unlocking-header'>
            <th className='header-secondary'>
              {t('Unstaking')}
              <LabelHelp
                help={t('Amount of CENNZ being unstaked')}
              />
            </th>
            <th className='header-secondary'>
              {t('Withdraw in')}
              <LabelHelp
                help={t('Time until stake is available to withdraw')}
              />
            </th>
          </tr>
        )}
        {unlocking?.map((chunk: UnlockChunk, index: number) => (
          <tr className='unlocking-info' key={index}>
            <td><FormatBalance value={chunk.value.toString()} symbol={STAKING_ASSET_NAME}/></td>
            <td>{`${Math.max(0, chunk.era.toNumber() - currentEra!.toNumber()).toString()} days`}</td>
          </tr>
        ))}
        </tbody>
  );
}