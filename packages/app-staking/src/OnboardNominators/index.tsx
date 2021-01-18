// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { useEffect, useState } from 'react';
import { KeyringSectionOption } from '@polkadot/ui-keyring/options/types';
import { BareProps } from "@polkadot/react-components/types";
import {
    InputAddress,
    Table,
    AddressSmall,
    Button,
    HelpOverlay,
    Icon,
    InputBalance,
    TxButton
} from "@polkadot/react-components";
import { useTranslation } from "@polkadot/app-staking/translate";
import { useAccounts, useApi, useCall } from "@polkadot/react-hooks";
import type { DeriveStakingElected } from '@polkadot/api-derive/types';
import FormatBalance from '@polkadot/app-generic-asset/FormatBalance';
import { poolRegistry } from "@polkadot/app-staking/Overview/Address/poolRegistry";
import { STAKING_ASSET_NAME } from "@polkadot/app-generic-asset/assetsRegistry";
import BN from "bn.js";
import { AssetId, Balance, Codec, AccountId } from "@cennznet/types";
import { Option } from '@polkadot/types';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import styled from 'styled-components';
import basicMd from '../md/basic.md';
import { colors } from '../../../../styled-theming';
import AccountCheckingModal from "@polkadot/app-accounts/modals/AccountsForStaking";

interface Props extends BareProps {
  isVisible: boolean;
}

function OnboardNominators ({ className, isVisible }: Props): React.ReactElement<Props> {
    const { api } = useApi();
    const electedInfo = useCall<DeriveStakingElected>(api.derive.staking.electedInfo);
    const minimumBond = useCall<Balance>(api.query.staking.minimumBond);
    const chainInfo = useCall<string>(api.rpc.system.chain, []);
    const [stashAccountId, setStashAccountId] = useState<string | null | undefined>();
    const [assetBalance, setAssetBalance] = useState<BN>(new BN(0));
    const stakingAssetId = useCall<AssetId>(api.query.genericAsset.stakingAssetId as any, []);
    const [extrinsic, setExtrinsic] = useState<SubmittableExtrinsic | null>(null);
    const [rewardDestinationId, setRewardDestinationId] = useState<string | null | undefined>();
    const [accountIdVec, setAccountIdVec] = useState<string[]>([]);
    const chain: string | undefined = chainInfo ? chainInfo.toString() : undefined;
    const [isValid, setIsValid] = useState<boolean>(false);
    const [openHelpDailog, setOpenHelpDailog] = useState<boolean>(false);
    const [isNoAccountsPopUpOpen, setIsNoAccountsPopUpOpen] = useState(true);
    const [amount, setAmount] = useState<BN | undefined>(new BN(0));
    // const _toggleCreate = (): void => setIsNoAccountsPopUpOpen(!isCreateOpen);
    useEffect((): void => {
        if (stakingAssetId && stashAccountId) {
            api.query.genericAsset.freeBalance(stakingAssetId, stashAccountId).then(
                (balance: Codec) => setAssetBalance((balance as Balance).toBn())
            );
        }
    }, [stakingAssetId, stashAccountId]);
    useEffect((): void => {
        if (accountIdVec.length === 0 || stashAccountId === null || rewardDestinationId === null || openAccountCheckingModal || amount?.isZero() || amount?.gte(assetBalance)) {
            setIsValid(false);
        } else {
            setIsValid(true);
        }
    }, [stashAccountId, rewardDestinationId, amount, accountIdVec]);

    // create an extrinsic if we have correct values
    useEffect((): void => {
        if (isValid) {
            const txs = [];
            const bondTx = api.tx.staking.bond(stashAccountId as string, amount as BN, { Account: rewardDestinationId});
            const nominateTx = api.tx.staking.nominate(accountIdVec);
            txs.push(bondTx);
            txs.push(nominateTx);
            setExtrinsic(api.tx.utility.batch(txs));
        }
    }, [isValid, stashAccountId, rewardDestinationId, amount]);

    const _validatorSelected = (element: any): void => {
        const accountSelected: string = element.currentTarget.value;
        const accounts: string[] = accountIdVec;
        if (element.target.checked && accountSelected) {
            accounts.push(accountSelected);
        } else if (!element.target.checked && accounts.includes(accountSelected)) {
            const index = accounts.indexOf(accountSelected);
            if (index > -1) {
                accounts.splice(index, 1);
            }
        }
        setAccountIdVec(accounts);
        if (accountIdVec.length === 0 || stashAccountId === null || rewardDestinationId === null || openAccountCheckingModal || amount?.isZero() || amount?.gte(assetBalance)) {
            setIsValid(false);
        } else {
            setIsValid(true);
        }
    }
    const { t } = useTranslation();
    const available = <span className='label'>{t('available')}</span>;
    const _toggleHelp = (): void => setOpenHelpDailog(!openHelpDailog);
    const _closeHelp = (): void => setOpenHelpDailog(false);

    // If user has no accounts then open a pop-up to create account /manage stake will appear
    const { allAccounts, hasAccounts } = useAccounts();
    const listAlreadyBonded = useCall<[]>(api.query.staking.bonded.multi, [allAccounts]);
    const controllersBonded = listAlreadyBonded?.map((account:Option<AccountId>)=> account.toString());
    const stashesBonded = listAlreadyBonded?.map((account:Option<AccountId>, index) => account.isSome ? allAccounts[index] : null);
    const filteredList = controllersBonded && allAccounts ? allAccounts.filter(account => !controllersBonded.includes(account) && !stashesBonded?.includes(account)) : [];
    const filteredOption: KeyringSectionOption[] = filteredList.map((address) => ({ key: address, name: address, value: address }));
    let openAccountCheckingModal = false;
    if (api.isReady && controllersBonded && (!hasAccounts || filteredList.length==0)) {
      openAccountCheckingModal = true;
    }
    let errorText = '';
    if (hasAccounts && minimumBond) {
      if ((amount as BN)?.lt(minimumBond as BN)) {
        errorText = `Minimum bond amount - ${minimumBond}`
      }
      else if (assetBalance.lt(amount as BN)){
        errorText = 'Not enough to stake'
      }
    }
    const notEnoughToStake =
      <span style={{ color: `${colors.red}` }}>
        {  t(errorText)}
      </span>;

  const closeNoAccountsPopUp = (): void => setIsNoAccountsPopUpOpen(false);

    return (
          <div className={className}>
            {openAccountCheckingModal && isNoAccountsPopUpOpen && (
              <AccountCheckingModal closeNoAccountsPopUp={closeNoAccountsPopUp}/>
            )}
            <HelpOverlay md={basicMd} openHelpDailog={openHelpDailog} closeHelp={_closeHelp}/>
            <div className='header'>
              Stake <b>CENNZ</b> and nominate the best validators to earn <b>CPAY</b> rewards
            </div>
            <Button className='know-risk'
                  label={t('Know the risks')}
                  icon='exclamation'
                  onClick={_toggleHelp}
                  isPrimary
            />
            <div className='nominator--Selection'>
                <div className='menuActive'>
                    <Icon name={'users'} size='big' color={'black'}/>
                    <span className='label'>{'new nominator'}</span>
                </div>
                <InputAddress
                    label={t('Stash')}
                    options={filteredOption}
                    defaultValue={filteredOption[0] ? filteredOption[0].value : null}
                    help={t('Choose an account to stake CENNZ with')}
                    labelExtra={!openAccountCheckingModal && <FormatBalance label={available} value={assetBalance} symbol={STAKING_ASSET_NAME}/>}
                    onChange={setStashAccountId}
                    type='account'
                />
                <InputAddress
                    label={t('Reward to')}
                    help={t('Choose an account where Cpay rewards will be paid')}
                    onChange={setRewardDestinationId}
                    type='allPlus'
                />
                <InputBalance
                    help={t('The amount of CENNZ to put at stake')}
                    label={t('Stake')}
                    labelExtra={errorText.length>0 && notEnoughToStake}
                    onChange={setAmount}
                />
                <div className='validator-info'>
                  <div className='label'>
                    Select validators to nominate
                  </div>
                  <Table>
                    <Table.Body>
                      <tr>
                        <th>{t('Validator')}</th>
                        <th>{t('Pool')}</th>
                        <th>{t('Commission')}</th>
                        <th>{t('Total Staked')}</th>
                        <th></th>
                      </tr>
                      {electedInfo?.info.map(({ accountId, exposure, validatorPrefs }): React.ReactNode => (
                        <tr className={className} key={accountId.toString()}>
                          <td className='address'>
                            <AddressSmall value={accountId.toString()} />
                          </td>
                          <td className='address'>
                            {chain? poolRegistry[chain][accountId.toString()]: 'CENTRALITY'}
                          </td>
                          <td>
                            {validatorPrefs["commission"].toHuman()}
                          </td>
                          <td>
                            {exposure.total?.toBn()?.gtn(0) && (
                              <FormatBalance value={exposure.total} symbol={STAKING_ASSET_NAME}/>)}
                          </td>
                          <td>
                            <input
                              className='checkbox'
                              type={"checkbox"}
                              value={accountId.toString()}
                              onClick={_validatorSelected}
                            />
                          </td>
                        </tr>
                      ))}
                    </Table.Body>
                  </Table>
                  <div className='submitTx'>
                    <TxButton
                      accountId={stashAccountId}
                      extrinsic={extrinsic}
                      icon='check'
                      isDisabled={!isValid}
                      isPrimary
                      label={t('nominate')}
                    />
                  </div>
                </div>
            </div>
          </div>
    );
}
export default styled(OnboardNominators)`
  .header {
    font-size: 22px;
    margin-top: 3rem;
    margin-left: 1.2rem;
    color: ${colors.N1000};
  }

  .ui.primary.button.know-risk {
    margin-top: 1.5rem;
    margin-left: 1.2rem;
    background-color: ${colors.highlightedOrange} !important;
  }

  .nominator--Selection {
    min-width: 663px;
    margin-top: 1.5rem;
    width: 50%;
    border-radius: 35px;
    padding: 20px 3.8rem 20px 20px;
    background: ${colors.N0};
  }

  .menuActive {
    margin-bottom: 2rem;
    i.big.icon, i.big.icons {
      font-size: 3rem;
    }
    .label {
      margin-left: 1rem;
      font-size: 22px;
      font-weight: 100;
    }
  }

  .validator-info {
    margin-top: 3rem;
    padding-left: 2rem;
    th {
      background: ${colors.N0};
      color: ${colors.matterhorn};
      text-align: left;
      font-size: 15px;
    }
    .label {
      font-size: 18px;
      font-weight: 100;
      margin-bottom: 2rem;
    }
    .submitTx {
      margin-left: 40%;
    }
    .checkbox {
      width:  20px;
      height: 20px;
      border:2px solid #555;
      cursor: pointer;
    }
  }
`;
