// Copyright 2017-2020 @polkadot/react-components authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Props } from '../types';

import React from 'react';

import Bare from './Bare';
import { Input } from '@polkadot/react-components';
import {AssetRegistry} from '@polkadot/app-generic-asset/assetsRegistry';

export default function AssetId ({ className, defaultValue: { value }, label, style, withLabel }: Props): React.ReactElement<Props> {
  let symbol = new AssetRegistry().get(value)?.symbol;
    return (
    <Bare
      className={className}
      style={style}
    >
      <Input
        className='full'
        defaultValue={`${symbol} / ${value}`}
        isDisabled={true}
        label={label}
        type={'text'}
        withEllipsis
        withLabel={withLabel}
      />
    </Bare>
  );
}

export {
  AssetId
};
