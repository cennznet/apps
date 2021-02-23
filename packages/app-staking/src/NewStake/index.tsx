// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { useEffect, useState } from 'react';
import { KeyringSectionOption } from '@polkadot/ui-keyring/options/types';
import { BareProps } from '@polkadot/react-components/types';
import {
    InputAddress,
    Table,
    AddressSmall,
    Button,
    HelpOverlay,
    InputBalance,
    TxButton
} from '@polkadot/react-components';
import { useTranslation } from '@polkadot/app-staking/translate';
import { useAccounts, useApi, useCacheKey, useCall, useToggle } from '@polkadot/react-hooks';
import type { DeriveStakingElected } from '@polkadot/api-derive/types';
import FormatBalance from '@polkadot/app-generic-asset/FormatBalance';
import { poolRegistry } from '@polkadot/app-staking/Overview/Address/poolRegistry';
import assetsRegistry, { STAKING_ASSET_NAME } from '@polkadot/app-generic-asset/assetsRegistry';
import BN from 'bn.js';
import { Balance, Codec } from '@cennznet/types';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import styled from 'styled-components';
import basicMd from '../md/basic.md';
import { colors } from '../../../../styled-theming';
import AccountCheckingModal from '@polkadot/app-accounts/modals/AccountsForStaking';
import { toFormattedBalance } from '@polkadot/react-components/util';
import { StakePair, STORE_STAKES } from '../MyStake/utils';

interface Props extends BareProps {
  isVisible: boolean;
}

function NewStake ({ className, isVisible }: Props): React.ReactElement<Props> {
    const { api } = useApi();
    const electedInfo = useCall<DeriveStakingElected>(api.derive.staking.electedInfo);
    const minimumBond = useCall<Balance>(api.query.staking.minimumBond);
    const chainInfo = useCall<string>(api.rpc.system.chain, []);
    const [stashAccountId, setStashAccountId] = useState<string | null | undefined>();
    const [assetBalance, setAssetBalance] = useState<BN>(new BN(0));
    const [extrinsic, setExtrinsic] = useState<SubmittableExtrinsic | null>(null);
    const [rewardDestinationId, setRewardDestinationId] = useState<string | null | undefined>();
    const [accountIdVec, setAccountIdVec] = useState<string[]>([]);
    const chain: string | undefined = chainInfo ? chainInfo.toString() : undefined;
    const [isValid, setIsValid] = useState<boolean>(false);
    const [openHelpDialog, setOpenHelpDialog] = useState<boolean>(false);
    const [acknowledged, toggleAcknowledged] = useToggle(false)
    const [isNoAccountsPopUpOpen, setIsNoAccountsPopUpOpen] = useState(true);
    const [amount, setAmount] = useState<BN | undefined>(new BN(0));

    useEffect((): void => {
        if (stashAccountId) {
            api.query.genericAsset.freeBalance(assetsRegistry.getStakingAssetId(), stashAccountId).then(
                (balance: Codec) => setAssetBalance((balance as Balance).toBn())
            );
        }
    }, [stashAccountId]);

    useEffect((): void => {
        if (accountIdVec.length === 0 || stashAccountId === null || rewardDestinationId === null || openAccountCheckingModal || amount?.isZero() || amount?.gt(assetBalance) || !acknowledged) {
            setIsValid(false);
        } else {
            setIsValid(true);
        }
    }, [stashAccountId, rewardDestinationId, amount, accountIdVec, acknowledged]);

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
    }
    const { t } = useTranslation();
    const available = <span className='label'>{t('available')}</span>;
    const _toggleHelp = (): void => {
      toggleAcknowledged();
      setOpenHelpDialog(!openHelpDialog);
    }
    const _closeHelp = (): void => {
      setOpenHelpDialog(false);
    }

    // If user has no accounts then open a pop-up to create account /manage stake will appear
    // use cache to load staked accounts
    const [getCache] = useCacheKey<string>(STORE_STAKES);
    var stakedAccounts_: Array<[string, StakePair]>;
    try {
      stakedAccounts_ = JSON.parse(getCache()!); 
    } catch (err) {
      stakedAccounts_ = new Array();
    }
    const [stakedAccounts] = useState<Array<[string, StakePair]>>(stakedAccounts_);

    const { hasAccounts, allAccounts } = useAccounts();
    const filteredOption: KeyringSectionOption[] =
    allAccounts
      .filter((account) => !stakedAccounts.find(([_, pair]) => account == pair.stashAddress || account == pair.controllerAddress))
      .map(address => ({
        key: address,
        value: address,
        name: address,
      }));

    const openAccountCheckingModal = !hasAccounts || filteredOption.length == 0;
    let errorText = '';
    if (hasAccounts && minimumBond) {
      if ((amount as BN)?.lt(minimumBond as BN)) {
        errorText = `minimum stake: ${toFormattedBalance({ value: minimumBond, unit: "CENNZ" })}`
      }
      else if (assetBalance.lt(amount as BN)){
        errorText = 'Not enough available'
      }
    }

    const notEnoughToStake =
      <span style={{ color: `${colors.red}` }}>
        {t(errorText)}
      </span>;

    const closeNoAccountsPopUp = (): void => setIsNoAccountsPopUpOpen(false);

    return (
      <div className={className}>
        <div className='new-stake-container'>
          {openAccountCheckingModal && isNoAccountsPopUpOpen && (
            <AccountCheckingModal closeNoAccountsPopUp={closeNoAccountsPopUp}/>
          )}
          <HelpOverlay md={basicMd} openHelpDailog={openHelpDialog} closeHelp={_closeHelp}/>
          <div className='header'>
            Stake <b>CENNZ</b> and nominate the best validators to earn <b>CPAY</b> rewards
          </div>
          <div className='nominator--Selection'>
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
                  help={t('Choose an account where CPAY rewards will be paid')}
                  onChange={setRewardDestinationId}
                  type='allPlus'
              />
              <InputBalance
                  help={t('The amount of CENNZ to put at stake')}
                  label={t('Stake')}
                  labelExtra={errorText.length > 0 && notEnoughToStake}
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
                  <Button
                    className='know-risk'
                    label={t('accept the risks')}
                    icon={acknowledged ? 'fa check square' : 'square'}
                    onClick={_toggleHelp}
                    isPrimary
                  />
                  <TxButton
                    accountId={stashAccountId}
                    extrinsic={extrinsic}
                    icon={'plus'}
                    isDisabled={!isValid}
                    isPrimary
                    label={t('nominate')}
                  />
                </div>
              </div>
          </div>
        </div>
      </div>
    );
}

export default styled(NewStake)`
  .new-stake-container {
    margin-left: 1em;
  }

  .header {
    font-size: 22px;
    margin-top: 3rem;
    color: ${colors.N700};
  }

  .ui--InputAddress,
  .ui--InputNumber {
    padding-left: 0 !important;
  }
  label {
    left: 1.5rem !important;
  }

  .ui.primary.button.know-risk {
    background-color: ${colors.N400} !important;
    icon {
      background: white;
    }
  }

  .nominator--Selection {
    min-width: 663px;
    margin-top: 1.5rem;
    width: 50%;
    border-radius: 8px;
  }

  .menuActive {
    margin-bottom: 2rem;
    .label {
      margin-left: 1rem;
      font-size: 22px;
      font-weight: 100;
    }
  }

  .validator-info {
    margin-top: 2rem;
    th {
      text-align: left;
      font-size: 15px;
      background: ${colors.primary} !important;
    }
    .label {
      font-size: 18px;
      font-weight: 100;
    }
    .submitTx {
      display: block;
    }
    .checkbox {
      width:  20px;
      height: 20px;
      border: 2px solid #555;
      cursor: pointer;
    }
  }
`;
