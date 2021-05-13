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

interface AssetInfo {
  decimals: number;
  name: string;
  id: string;
}

function TransferWithType ({ className, onClose, recipientId: propRecipientId, senderId: propSenderId, t }: Props): React.ReactElement<Props> {
  const { api } = useApi();
  const [assetBalance, setAssetBalance] = useState<BN>(new BN(0));
  // The BN value for transaction (no decimal)
  const [amount, setAmount] = useState<BN | undefined>(undefined);
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
  const [asset, setAsset] = useState<AssetInfo>(
    getAssetInfo(dropdownOptions[0].value)
  );

  // Query balances on asset change
  useMemo((): void => {
    // @ts-ignore
    api.query.genericAsset.freeBalance(asset.id, senderId!).then(
      (balance: Codec) => setAssetBalance((balance as Balance).toBn())
    );
  }, [asset, senderId]);

  useEffect((): void => {
    if (amount !== undefined && !amount!.isZero()) {
      setHasAvailable(amount.lte(assetBalance));
    } else {
      setHasAvailable(true);
    }
  }, [amount, assetBalance]);

  // create an extrinsic if we have correct values
  useEffect((): void => {
    setExtrinsic(
      recipientId && senderId && amount
        ? api.tx.genericAsset.transfer(asset.id, recipientId, amount)
        : null
    );
  }, [asset, amount, recipientId]);

  // When assetId is selected, update asset info also
  function getAssetInfo(assetId: string): AssetInfo {
    let info = new AssetRegistry().get(assetId);
    let decimals = info?.decimals || formatBalance.getDefaults().decimals;
    return {
      id: assetId,
      decimals,
      name: info?.symbol || "?",
    }
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
                symbol={asset.name}
                decimals={asset.decimals}
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
            onChange={(assetId) => setAsset(getAssetInfo(assetId))}
            options={dropdownOptions}
            value={asset.id}
          />
          <InputBalance
            decimals={asset.decimals}
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
