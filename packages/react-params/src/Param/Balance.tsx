// Copyright 2017-2020 @polkadot/react-components authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Props as BaseProps } from '../types';

import BN from 'bn.js';
import React from 'react';
import { InputBalance } from '@polkadot/react-components';

import Bare from './Bare';

interface Props extends BaseProps {
  // number of decimal places in the value
  decimals?: number;
}

export default function Balance ({ className, defaultValue: { value }, decimals, isDisabled, isError, label, onChange, onEnter, onEscape, style, withLabel }: Props): React.ReactElement<Props> {
  const _onChange = (value?: BN): void =>
    onChange && onChange({
      isValid: !isError && !!value,
      value
    });

  return (
    <Bare
      className={className}
      style={style}
    >
      <InputBalance
        className='full'
        defaultValue={value}
        isDisabled={isDisabled}
        isError={isError}
        label={label}
        onChange={_onChange}
        withEllipsis
        onEnter={onEnter}
        onEscape={onEscape}
        withLabel={withLabel}
        decimals={decimals}
      />
    </Bare>
  );
}

export {
  Balance
};
