// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { DeriveAccountInfo } from '@polkadot/api-derive/types';
import { ActionStatus } from '@polkadot/react-components/Status/types';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AddressSmall, Button, ChainLock, Forget, Icon, Menu, Popup, Input } from '@polkadot/react-components';
import AddressInfo from './AddressInfoMvp';
import { useApi, useCall, useToggle } from '@polkadot/react-hooks';
import keyring from '@polkadot/ui-keyring';

import Backup from './modals/Backup';
import ChangePass from './modals/ChangePass';
import Derive from './modals/Derive';
import Identity from './modals/Identity';
import TransferWithType from './modals/TransferWithType';
import { useTranslation } from './translate';
import { colors } from '../../../styled-theming';

interface Props {
  address: string;
  className?: string;
  isFavorite: boolean;
  toggleFavorite: (address: string) => void;
}

function Account ({ address, className, isFavorite, toggleFavorite }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const api = useApi();
  const info = useCall<DeriveAccountInfo>(api.api.derive.accounts.info as any, [address]);
  const [accName, setAccName] = useState('');
  const [genesisHash, setGenesisHash] = useState<string | null>(null);
  const [{ isDevelopment, isEditable, isExternal }, setFlags] = useState({ isDevelopment: false, isEditable: false, isExternal: false });
  const [isEditingName, toggleEditName] = useToggle();
  const [isBackupOpen, toggleBackup] = useToggle();
  const [isDeriveOpen, toggleDerive] = useToggle();
  const [isForgetOpen, toggleForget] = useToggle();
  const [isIdentityOpen, toggleIdentity] = useToggle();
  const [isPasswordOpen, togglePassword] = useToggle();
  const [isSettingsOpen, toggleSettings] = useToggle();
  const [isTransferOpen, toggleTransfer] = useToggle();

  useEffect((): void => {
    const { identity, nickname } = info || {};

    if (api.api.query.identity && api.api.query.identity.identityOf) {
      if (identity?.display) {
        setAccName(identity.display);
      }
    } else if (nickname) {
      setAccName(nickname);
    }
  }, [info]);

  useEffect((): void => {
    const account = keyring.getAccount(address);

    setGenesisHash(account?.meta.genesisHash || null);
    setFlags({
      isDevelopment: account?.meta.isTesting || false,
      isEditable: (account && !(account.meta.isInjected || account.meta.isHardware)) || false,
      isExternal: account?.meta.isExternal as boolean || false
    });
    setAccName(account?.meta.name || '');
  }, [address]);

  const _saveName = (): void => {
    toggleEditName();

    const meta = { name: accName, whenEdited: Date.now() };

    if (address) {
      try {
        const currentKeyring = keyring.getPair(address);

        currentKeyring && keyring.saveAccountMeta(currentKeyring, meta);
      } catch (error) {
        keyring.saveAddress(address, meta);
      }
    }
  };

  const _onForget = (): void => {
    if (!address) {
      return;
    }

    const status: Partial<ActionStatus> = {
      account: address,
      action: 'forget'
    };

    try {
      keyring.forgetAccount(address);
      status.status = 'success';
      status.message = t('account forgotten');
    } catch (error) {
      status.status = 'error';
      status.message = error.message;
    }
  };
  const _onGenesisChange = (genesisHash: string | null): void => {
    const account = keyring.getPair(address);

    account && keyring.saveAccountMeta(account, { ...account.meta, genesisHash });

    setGenesisHash(genesisHash);
  };
  const _onFavorite = (): void => toggleFavorite(address);

  return (
    <tr className={className}>
      <td className='favorite'>
        <Icon
          className={`${isFavorite && 'isSelected'}`}
          name={isFavorite ? 'star' : 'star outline'}
          onClick={_onFavorite}
        />
      </td>
      <td className='middle'>
        <AddressSmall
          overrideName={
            isEditingName ? (
              <Input
                className='name--input'
                autoFocus
                defaultValue={accName}
                onBlur={_saveName}
                onChange={setAccName}
                onEnter={_saveName}
                withLabel={false}
              />
            ) : (
              undefined
            )
          }
          onClickName={toggleEditName}
          toggle={isEditingName}
          value={address}
        />
        {isBackupOpen && (
          <Backup
            address={address}
            key='modal-backup-account'
            onClose={toggleBackup}
          />
        )}
        {isDeriveOpen && (
          <Derive
            from={address}
            key='modal-derive-account'
            onClose={toggleDerive}
          />
        )}
        {isForgetOpen && (
          <Forget
            address={address}
            onForget={_onForget}
            key='modal-forget-account'
            onClose={toggleForget}
          />
        )}
        {isIdentityOpen && (
          <Identity
            address={address}
            key='modal-identity'
            onClose={toggleIdentity}
          />
        )}
        {isPasswordOpen && (
          <ChangePass
            address={address}
            key='modal-change-pass'
            onClose={togglePassword}
          />
        )}
        {isTransferOpen && (
          <TransferWithType
            key='modal-transfer'
            onClose={toggleTransfer}
            senderId={address}
          />
        )}
      </td>
      <td className='middle'>
        <AddressInfo
          address={address}
          withBalance
          withBalanceToggle
          withExtended={false}
        />
      </td>
       <td className='number middle'>
        <Popup
          className='theme--default'
          onClose={toggleSettings}
          open={isSettingsOpen}
          position='bottom right'
          trigger={
            <Button
              icon='setting'
              onClick={toggleSettings}
              size='small'
            />
          }
        >
          <Menu
            vertical
            text
            onClick={toggleSettings}
          >
            <Menu.Item
              disabled={!isEditable || isExternal || isDevelopment}
              onClick={toggleBackup}
              style={{ color: colors.N100 }}
            >
              {t('Create a backup file for this account')}
            </Menu.Item>
            <Menu.Item
              disabled={!isEditable || isExternal || isDevelopment}
              onClick={togglePassword}
              style={{ color: colors.N100 }}
            >
              {t("Change this account's password")}
            </Menu.Item>
            <Menu.Item
              disabled={!isEditable || isDevelopment}
              onClick={toggleForget}
              style={{ color: colors.N100 }}
            >
              {t('Forget this account')}
            </Menu.Item>
            {!api.isDevelopment && (
              <>
                <Menu.Divider />
                <ChainLock
                  className='accounts--network-toggle'
                  genesisHash={genesisHash}
                  onChange={_onGenesisChange}
                  preventDefault
                />
              </>
            )}
          </Menu>
        </Popup>
        <Button
          icon='history'
          key='history'
          label={t('History')}
          onClick={() => { location.href = `https://uncoverexplorer.com/account/${address}` }}
          size='small'
          tooltip={t('View account transaction history')}
        />
        <Button
          icon='paper plane'
          isPrimary
          key='send'
          label={t('Send')}
          onClick={() => toggleTransfer()}
          size='small'
          tooltip={t('Send funds from this account')}
        />
      </td>
    </tr>
  );
}

export default styled(Account)`
  .accounts--Account-buttons {
    text-align: right;
  }

  .tags--toggle {
    cursor: pointer;
    width: 100%;
    min-height: 1.5rem;

    label {
      cursor: pointer;
    }
  }

  .name--input {
    width: 16rem;
  }
`;
