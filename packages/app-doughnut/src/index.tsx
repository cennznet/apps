// Copyright 2017-2020 @polkadot/app-123code authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';
import { AppProps as Props } from '@polkadot/react-components/types';
import { Doughnut } from "@plugnet/doughnut-wasm";
import { InputAddress } from '@polkadot/react-components';
import Input from 'semantic-ui-react/dist/commonjs/elements/Input/Input';
import { useTranslation } from './translate';
import BN from 'bn.js';
import Bytes from '@polkadot/react-params/Param/Bytes';
import { RawParam } from '@polkadot/react-params/types';
import Button from '@polkadot/react-components/Button/Button';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import keyring from '@polkadot/ui-keyring';

export default function DoughnutApp({ className }: Props): React.ReactElement<Props> {

  const { t } = useTranslation();

  const [issuerId, setIssuerId] = useState();
  const [holderId, setHolderId] = useState();
  const [expiry, setExpiry] = useState(new BN(Date.now()));
  const [notBefore, setNotBefore] = useState(new BN(0));
  const [domain, setDomain] = useState(null);
  const [doughnut, setDoughnut] = useState<Uint8Array | undefined>();

  // Issue a doughnut from input params
  const makeDoughnut = () => {
    const d = new Doughnut(
        keyring.decodeAddress(issuerId),
        keyring.decodeAddress(holderId),
        Date.now() + 60_000,
        0
      )
    .addDomain("cennznet", new Uint8Array([1,2,3,4,5]));

    // sr25519 sign only
    let signature = keyring.getPair(issuerId).sign(d.payload());
    let encoded = d.encode();
    encoded.set(signature, (encoded.length - 64));

    console.log(encoded);
    console.log(u8aToHex(encoded));
    setDoughnut(encoded);
  };

  return (
    <main className={className}>
      <h2>D🍩UGHNUT MAKER</h2>
      <div>
        <InputAddress
          help={t('The account that will issue the doughnut.')}
          label={t('issuer')}
          onChange={setIssuerId}
          type='account'
        />
        <InputAddress
          help={t('The account that will use the doughnut.')}
          label={t('holder')}
          onChange={setHolderId}
          type='allPlus'
        />
        <Input
          defaultValue={expiry}
          help={t('When the doughnut will expire.')}
          label={t('expiry (unix timestamp)')}
          onChange={setExpiry}
          type={'datetime'}
        />
        <Input
          defaultValue={notBefore}
          help={t('When the doughnut will activate.')}
          label={t('not before (unix timestamp)')}
          onChange={setNotBefore}
          type={'datetime'}
        />
        <Bytes
          defaultValue={"0x0" as unknown as RawParam}
          help={t('The doughnut permissions')}
          label={t('permission domain')}
          onChange={setDomain}
        />
        <Button
          icon='add'
          isPrimary
          label={t('Make')}
          onClick={makeDoughnut}
          isDisabled={!domain}
        />
      </div>
      <h3>{'👨‍🍳 ' + u8aToHex(doughnut)}</h3>
    </main>
  );
}
