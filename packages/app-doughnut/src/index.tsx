// Copyright 2017-2020 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { Doughnut } from '@plugnet/doughnut-wasm';
import Unlock from '@polkadot/app-toolbox/Unlock';
import { KeyringPair } from '@polkadot/keyring/types';
import { Input, InputAddress, StatusContext } from '@polkadot/react-components';
import Button from '@polkadot/react-components/Button/Button';
import { AppProps as Props } from '@polkadot/react-components/types';
import keyring from '@polkadot/ui-keyring';
import { hexToU8a, isHex, u8aToHex } from '@polkadot/util';

import { useTranslation } from './translate';

export default function DoughnutApp({ className }: Props): React.ReactElement<Props> {

  var date = new Date();
  const today = `${date.getFullYear()}-${date.getMonth().toString().padStart(2, "0")}-${date.getDay().toString().padStart(2, "0")}`;
  date.setDate(date.getDate() - 1);
  const yesterday = `${date.getFullYear()}-${date.getMonth().toString().padStart(2, "0")}-${date.getDay().toString().padStart(2, "0")}`;

  const { t } = useTranslation();

  // Queue clipboard event
  const { queueAction } = useContext(StatusContext);
  const _onCopy = (): void => {
    queueAction && queueAction({
      account: '',
      action: t('clipboard'),
      status: 'queued',
      message: t('🍩💙📋')
    });
  };

  const [issuerPair, setIssuerPair] = useState<KeyringPair | null>(keyring.getPairs()[0] || null);
  const _onChangeAccount = (accountId: string | null): void => setIssuerPair(keyring.getPair(accountId || ''));

  const [holderAddress, setHolderAddress] = useState<string | null>();
  const [expiry, setExpiry] = useState<string>(today);
  const [notBefore, setNotBefore] = useState<string>(yesterday);
  const [domainValue, setDomainValue] = useState<string | undefined>();
  const [domainKey, setDomainKey] = useState<string | undefined>();
  const [doughnut, setDoughnut] = useState<Uint8Array | undefined>();

  // Issue a doughnut from input params
  const makeDoughnut = () => {

    // pacify TS null checks
    if (!issuerPair || !holderAddress || !domainValue || !domainKey) return;

    var d = new Doughnut(
      keyring.decodeAddress(issuerPair.address),
      keyring.decodeAddress(holderAddress),
      new Date(expiry).getTime() / 1000,
      new Date(notBefore).getTime() / 1000
    )
      .addDomain(domainKey, hexToU8a(domainValue));

    // We can't get the private key bytes here for good reason
    // therefore we must sign the doughnut using external methods.
    if (issuerPair.type === 'sr25519') {
      // sr25519 is not implemented yet.
      // @polkadot schnorrkel libs are hard coded to use signing context 'substrate'
      // which will create unverifiable doughnuts
      alert("sr25519 signing is not supported yet 😔\n Please use an ed25519 based account");
    } else if (issuerPair.type === 'ed25519') {
      // Sign using UI keypair
      // hack: to set the signature version to ed25519
      d.signEd25519(new Uint8Array(32));
      // sign and attach the signature
      let signature = issuerPair.sign(d.payload());
      let encoded = d.encode();
      encoded.set(signature, encoded.length - signature.length);

      setDoughnut(encoded);
    }
  };

  return (
    <main className={className}>
      <h2>D🍩UGHNUT MAKER</h2>
      <div>
        {
          // User must unlock account to sign doughnuts
          issuerPair?.isLocked && (
            <Unlock
              onClose={() => { }}
              onUnlock={() => { }}
              pair={issuerPair}
            />)
        }
        <InputAddress
          className='full'
          help={t('The account that will issue the doughnut.')}
          label={t('issuer')}
          isInput={false}
          onChange={_onChangeAccount}
          type='account'
        />
        <InputAddress
          help={t('The account that will use the doughnut.')}
          label={t('holder')}
          onChange={setHolderAddress}
          type='allPlus'
        />
        <Input
          help={t('When the doughnut will expire.')}
          value={expiry}
          label={t('expiry')}
          onChange={setExpiry}
          type='date'
        />
        <Input
          value={notBefore}
          help={t('When the doughnut will activate.')}
          label={t('not before')}
          onChange={setNotBefore}
          type='date'
        />
        <Input
          placeholder='cennznet'
          label={t('domain key (utf8)')}
          onChange={setDomainKey}
          type='text'
        />
        <Input
          placeholder='0x'
          label={t('domain value (hex)')}
          onChange={setDomainValue}
          type='text'
        />
        <Button
          icon='key'
          isPrimary
          label={t('Make')}
          onClick={makeDoughnut}
          isDisabled={
            domainValue === undefined || domainKey === undefined ||
            domainKey.length <= 0 || !isHex(domainValue)
          }
        />
      </div>
      <h3 hidden={!doughnut}>{'Et Voilà! 👨‍🍳:'}</h3>
      <CopyToClipboard text={u8aToHex(doughnut)} onCopy={_onCopy}>
        <div style={{ cursor: 'copy', overflowWrap: 'break-word' }} hidden={!doughnut}>
          {u8aToHex(doughnut)}
        </div>
      </CopyToClipboard>
    </main>
  );
}
