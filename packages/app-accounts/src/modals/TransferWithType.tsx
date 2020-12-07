// Copyright 2019 @polkadot/app-generic-asset authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { I18nProps } from '@polkadot/react-components/types';
import { AssetId, Balance } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { InputAddress, InputBalance, TxButton, Dropdown, Modal } from '@polkadot/react-components';
import { useApi, useDebounce } from '@polkadot/react-hooks';
import Checks from '@polkadot/react-signer/Checks';
import { withMulti, withObservable } from '@polkadot/react-api/hoc';
import { u8aToString } from '@polkadot/util';
import assetRegistry from '../../../app-generic-asset/src/assetsRegistry';
import translate from '../../../app-generic-asset/src/translate';
import FormatBalance from '@polkadot/app-generic-asset/FormatBalance';
import { Bytes } from '@cennznet/types';
import { toFormattedBalance } from '@polkadot/react-components/util';

interface Props extends I18nProps {
  className?: string;
  onClose: () => void;
  recipientId?: string;
  senderId?: string;
}

interface AssetInfo {
  id: AssetId;
  symbol: Bytes;
}

interface Option {
  text: string;
  value: string;
}

// ~ largest value `BN` can handle before overflow issues
const maxValue = new BN('1,000,000,000,000');

function TransferWithType ({ className, onClose, recipientId: propRecipientId, senderId: propSenderId, t }: Props): React.ReactElement<Props> {
  const { api } = useApi();
  const [assetId, setAssetId] = useState('0');
  const [assetBalance, setAssetBalance] = useState<BN>(new BN(0));
  const [assetName, setAssetName] = useState<string>('');
  // The BN value for transaction (no decimal)
  const [_amount, setAmount] = useState<BN | undefined>(undefined);
  const amount = useDebounce(_amount, 700);
  // The formatted value to display (includes decimal)
  const [amountDisplay, setAmountDisplay] = useState<string>("");

  const [extrinsic, setExtrinsic] = useState<SubmittableExtrinsic | null>(null);
  const [hasAvailable, setHasAvailable] = useState(true);
  const [options, setOptions] = useState<Option[]>([]);
  const [recipientId, setRecipientId] = useState(propRecipientId || null);
  const [senderId, setSenderId] = useState(propSenderId || null);

  // Query registered assets on first load
  useEffect((): void => {
    // @ts-ignore
    api.rpc.genericAsset.registeredAssets().then(
      (assets: Array<[AssetId, AssetInfo]>) => {
        const dropdownOptions: Option[] = assets && assets.length > 0 && assets.map(([id, info]) => {
          return {
            text: u8aToString(info.symbol),
            value: id.toString(),
          } as Option;
        }) || [];

        setOptions(dropdownOptions);
        setAssetId(dropdownOptions[0].value || "0");
        setAssetName(dropdownOptions[0].text || "?");
      });
  }, []);

  // Query balances on assetId or senderId change
  useMemo((): void => {
    // @ts-ignore
    api.query.genericAsset.freeBalance(assetId, senderId || '').then(
      (balance: any) => setAssetBalance((balance as Balance).toBn())
    );
  }, [assetId]);

  useEffect((): void => {
    if (amount !== undefined && !amount!.isZero()) {
      setHasAvailable(amount.lte(assetBalance));
      setAmountDisplay(toFormattedBalance({ value: amount }));
    } else {
      setHasAvailable(true);
      setAmountDisplay(amount !== undefined ? '0' : '');
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

  // When assetId is selected, update assetName also
  function setAssetId_(assetId: string): void {
    setAssetId(assetId);
    setAssetName(options.find(x => x.value == assetId)?.text || "?");
  }

  const notEnoughTransferrable = <span style={{ color: "#9f3a38" }}>{t('not enough transferrable')}</span>;
  const maxButton = <div className="maxBtn" onClick={() => setAmount(BN.min(assetBalance, maxValue))}>max</div>;

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
            onChange={setAssetId_}
            options={options}
            value={assetId}
          />
          <InputBalance
            help={t('Enter the amount you want to transfer.')}
            isError={!hasAvailable}
            label={<span>{t('Send amount')}{maxButton}</span>}
            labelExtra={!hasAvailable && notEnoughTransferrable}
            onChange={setAmount}
            value={amountDisplay}
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

    .maxBtn {
      display: inline;
      border-radius: 5px;
      padding: 1px 5px 1px 5px;
      margin-left: 4px;
      color: rgba(78,78,78,.66);
      border: 1px solid rgba(78,78,78,.66);
      background-color: white;
    }

    .maxBtn:hover {
      color: #f191359e;
      border: 1px solid #f191359e;
      cursor: pointer;
    }
  `,
  translate,
  withObservable(assetRegistry.subject, { propName: 'assets' })
);
