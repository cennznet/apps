// Copyright 2019 @polkadot/app-generic-asset authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Balance, Codec } from '@cennznet/types';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { AssetRegistry } from '@polkadot/app-generic-asset/assetsRegistry';
import FormatBalance from '@polkadot/app-generic-asset/FormatBalance';
import { withMulti } from '@polkadot/react-api/hoc';
import { Dropdown, InputAddress, InputBalance, Modal, TxButton } from '@polkadot/react-components';
import { I18nProps } from '@polkadot/react-components/types';
import { useApi } from '@polkadot/react-hooks';
import Checks from '@polkadot/react-signer/Checks';
import BN from 'bn.js';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import translate from '../../../app-generic-asset/src/translate';
import { formatBalance } from '@polkadot/util';

interface Props extends I18nProps {
  className?: string;
  onClose: () => void;
  recipientId?: string;
  senderId?: string;
}

interface Option {
  text: string;
  value: string;
}

function TransferWithType ({ className, onClose, recipientId: propRecipientId, senderId: propSenderId, t }: Props): React.ReactElement<Props> {
  const { api } = useApi();
  const [assetId, setAssetId] = useState<string | undefined>(undefined);
  const [assetBalance, setAssetBalance] = useState<BN>(new BN(0));
  const [assetName, setAssetName] = useState<string>('');
  // The BN value for transaction (no decimal)
  const [amount, setAmount] = useState<BN | undefined>(undefined);
  const [decimals, setDecimals] = useState<number | undefined>();
  const [extrinsic, setExtrinsic] = useState<SubmittableExtrinsic | null>(null);
  const [hasAvailable, setHasAvailable] = useState(true);
  const [recipientId, setRecipientId] = useState(propRecipientId || null);
  const [senderId, setSenderId] = useState(propSenderId || null);
  const dropdownOptions: Option[] = new AssetRegistry().getAssets().map(([id, info]) => {
    return {
      text: info.symbol,
      value: id,
    } as Option;
  });

  useEffect(() => {
    if(!assetId) setAsset(dropdownOptions[0].value);
  }, [dropdownOptions]);

  // Query balances on assetId or senderId change
  useMemo((): void => {
    if(!assetId) return;
    // @ts-ignore
    api.query.genericAsset.freeBalance(assetId, senderId!).then(
      (balance: Codec) => setAssetBalance((balance as Balance).toBn())
    );
  }, [assetId]);

  useEffect((): void => {
    if (amount !== undefined && !amount!.isZero()) {
      setHasAvailable(amount.lte(assetBalance));
    } else {
      setHasAvailable(true);
    }
  }, [assetId, amount, assetBalance]);

  // create an extrinsic if we have correct values
  useEffect((): void => {
    setExtrinsic(
      recipientId && senderId && amount
        ? api.tx.genericAsset.transfer(assetId, recipientId, amount)
        : null
    );
  }, [amount, assetId, recipientId]);

  // When assetId is selected, update asset info also
  function setAsset(assetId: string): void {
    setAssetId(assetId);
    let info = new AssetRegistry().get(assetId);
    let decimals = info?.decimals || formatBalance.getDefaults().decimals;
    setDecimals(decimals);
    setAssetName(info?.symbol || "?");
  }

  const notEnoughTransferrable = <span style={{ color: "#9f3a38" }}>{t('not enough transferrable')}</span>;

  return (
    <Modal style={{ marginTop: "8rem", minWidth: "50%", maxWidth: "600px" }} header={t('Send funds')}>
      <Modal.Content>
        <div className={className}>
          <InputAddress
            defaultValue={propSenderId}
            help={t('The account you will send funds from.')}
            isDisabled={!!propSenderId}
            label={t('Send from account')}
            labelExtra={
              <FormatBalance
                className={className}
                value={assetBalance}
                symbol={assetName}
                decimals={decimals}
              />
            }
            onChange={setSenderId}
            type='account'
          />
          <InputAddress
            defaultValue={propRecipientId}
            help={t(
              'Select a contact or paste the address you want to send funds to.'
            )}
            isDisabled={!!propRecipientId}
            label={t('Send to address')}
            onChange={setRecipientId}
            type='allPlus'
          />
          <Dropdown
            help={t('Select the asset you want to transfer.')}
            label={t('Asset type')}
            onChange={setAsset}
            options={dropdownOptions}
            value={assetId}
          />
          <InputBalance
            decimals={decimals}
            help={t('Enter the amount you want to transfer.')}
            isError={!hasAvailable}
            label={<span>{t('Send amount')}</span>}
            labelExtra={!hasAvailable && notEnoughTransferrable}
            onChange={setAmount}
            isZeroable={true}
          />
          <Checks
            accountId={senderId}
            extrinsic={extrinsic}
            isSendable
            onChange={setHasAvailable}
          />
        </div>
      </Modal.Content>
      <Modal.Actions onCancel={onClose}>
        <TxButton
          accountId={senderId}
          extrinsic={extrinsic}
          icon='send'
          isDisabled={!hasAvailable}
          isPrimary
          label={t('Send')}
          onStart={onClose}
        />
      </Modal.Actions>
    </Modal>
  );
}

export default withMulti(
  styled(TransferWithType)`
    article.padded {
      box-shadow: none;
      margin-left: 2rem;
    }

    .balance {
      margin-bottom: 0.5rem;
      text-align: right;
      padding-right: 1rem;

      .label {
        opacity: 0.7;
      }
    }

    label.with-help {
      flex-basis: 10rem;
    }
  `,
  translate
);
