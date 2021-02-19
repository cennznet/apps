// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import React, { useEffect, useState } from 'react';
import { BareProps } from "@polkadot/react-components/types";
import {
  InputAddress,
  Table,
  AddressSmall,
  TxButton, StakingExtrinsic, Modal
} from "@polkadot/react-components";
import { useTranslation } from "@polkadot/app-staking/translate";
import { useApi, useCall } from "@polkadot/react-hooks";
import type { DeriveStakingElected } from '@polkadot/api-derive/types';
import FormatBalance from '@polkadot/app-generic-asset/FormatBalance';
import { poolRegistry } from "@polkadot/app-staking/Overview/Address/poolRegistry";
import { STAKING_ASSET_NAME } from "@polkadot/app-generic-asset/assetsRegistry";
import BN from "bn.js";
import { AssetId, StakingLedger } from "@cennznet/types";
import { Option } from '@polkadot/types';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import styled from 'styled-components';

interface Props extends BareProps {
  stakedAccountId: string;
  onClose: () => void;
}

function ManageStake ({ className, stakedAccountId, onClose }: Props): React.ReactElement<Props> {
    const { api } = useApi();
    const defaultSection = Object.keys(api.tx)[0];
    const defaultMethod = Object.keys(api.tx[defaultSection])[0];
    const apiDefaultTx = api.tx[defaultSection][defaultMethod];
    const apiDefaultTxSudo = (api.tx.staking && api.tx.staking.setController) || apiDefaultTx;
    const electedInfo = useCall<DeriveStakingElected>(api.derive.staking.electedInfo);
    const [method, setMethod] = useState<SubmittableExtrinsic | null>();
    const chainInfo = useCall<string>(api.rpc.system.chain, []);
    const [assetBalance, setAssetBalance] = useState<BN>(new BN(0));
    const stakingAssetId = useCall<AssetId>(api.query.genericAsset.stakingAssetId as any, []);
    const [extrinsic, setExtrinsic] = useState<SubmittableExtrinsic | null>(null);
    const [accountIdVec, setAccountIdVec] = useState<string[]>([]);
    const chain: string | undefined = chainInfo ? chainInfo.toString() : undefined;
    const [isValid, setIsValid] = useState<boolean>(false);
    const [showValidatorList, setShowValidatorList] = useState<boolean>(false);
    useEffect((): void => {
        if (stakingAssetId && stakedAccountId) {
            api.query.staking.ledger(stakedAccountId).then(
                (ledger: Option<StakingLedger>) => {
                  if (ledger.isSome) {
                    setAssetBalance((ledger.unwrap().total).toBn());
                  }
                }
            );
        }
    }, [stakingAssetId, stakedAccountId]);
    useEffect((): void => {
      if (method) {
        const methodName = api.findCall(method.callIndex).method;
        if (methodName === 'nominate' && accountIdVec.length === 0 || stakedAccountId === null) {
              setIsValid(false);
          } else {
              setIsValid(true);
          }
      } else {
        setIsValid(false);
      }
    }, [stakedAccountId, method, accountIdVec]);

  useEffect((): void => {
    if (method) {
      const methodName = api.findCall(method.callIndex).method;
      if (methodName === 'nominate') {
        setShowValidatorList(true);
      } else {
        setShowValidatorList(false);
      }
    }
  }, [method]);

    // create an extrinsic if we have correct values
    useEffect((): void => {
        if (isValid && method) {
          const fn = api.findCall(method.callIndex);
          const methodName = fn.method;
          if (methodName === 'nominate') {
            setExtrinsic(api.tx.staking.nominate(accountIdVec));
          } else {
            setExtrinsic(api.tx[fn.section][fn.method](...method.args));
          }
        }
    }, [isValid, stakedAccountId, method, accountIdVec]);

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
        if (accounts.length !== 0 && stakedAccountId !== null) {
          setIsValid(true);
          setExtrinsic(api.tx.staking.nominate(accounts));
        } else {
          setIsValid(false);
        }
    }

    const { t } = useTranslation();
    const stake = <span className='label'>{t('stake')}</span>;

    return (
        <Modal style={{ marginTop: "8rem", minWidth: "50%", maxWidth: "700px" }} header={t('Manage stake')}>
          <Modal.Content>
            <div className={className}>
              <div className='nominator--Selection'>
                  <InputAddress
                      label={t('Account')}
                      defaultValue={stakedAccountId}
                      labelExtra={<FormatBalance label={stake} value={assetBalance} symbol={STAKING_ASSET_NAME}/>}
                      type='account'
                      isDisabled={true}
                  />
                  <StakingExtrinsic
                    defaultValue={apiDefaultTxSudo}
                    label={t('Action')}
                    onChange={setMethod}
                  />
                  <div className='validator-info' style={showValidatorList ? {display: "block"} : {display: "none"}}>
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
                  </div>
              </div>
            </div>
            </Modal.Content>
            <Modal.Actions onCancel={onClose}>
              <TxButton
                accountId={stakedAccountId}
                extrinsic={extrinsic}
                icon='sign-in'
                isDisabled={!isValid}
                isPrimary
                label={t('Submit Transaction')}
              />
          </Modal.Actions>
      </Modal>
    );
}

export default styled(ManageStake)`
  .header {
    font-size: 22px;
    margin-top: 3rem;
    margin-left: 1.2rem;
  }

  .nominator--Selection {
    border-radius: 8px;
    padding-right: 2em;
  }

  .menuActive {
    i.big.icon, i.big.icons {
      font-size: 3rem;
    }
    .label {
      margin-left: 1rem;
      font-size: 22px;
      font-weight: 100;
    }
  }
  .submitTx {
    margin-top: 5%;
    margin-left: 35%;
  }

  .validator-info {
    margin-top: 3rem;
    padding-left: 2rem;
    th {
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
