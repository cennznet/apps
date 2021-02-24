// Copyright 2017-2020 @polkadot/react-components authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { SubmittableExtrinsicFunction } from '@polkadot/api/types';

import React, { useState } from 'react';
import { useApi } from '@polkadot/react-hooks';

import LinkedWrapper from './LinkedWrapper';
import SelectMethod from './SelectMethod';
import methodOptions from './options/method';

interface Props {
  className?: string;
  defaultValue: SubmittableExtrinsicFunction<'promise'>;
  help?: React.ReactNode;
  isDisabled?: boolean;
  isError?: boolean;
  isPrivate?: boolean;
  label: React.ReactNode;
  onChange: (value: SubmittableExtrinsicFunction<'promise'>) => void;
  style?: any;
  withLabel?: boolean;
}

export default function InputExtrinsic ({ className, defaultValue, help, label, onChange, style, withLabel }: Props): React.ReactElement<Props> {
  const { api } = useApi();
  const optionsMethod = methodOptions(api, defaultValue.section);
  const [value, setValue] = useState<SubmittableExtrinsicFunction<'promise'>>((): SubmittableExtrinsicFunction<'promise'> => defaultValue);

  const _onKeyChange = (newValue: SubmittableExtrinsicFunction<'promise'>): void => {
    if (value.section === newValue.section && value.method === newValue.method) {
      return;
    }

    // set this via callback, since the we are setting a function (aletrnatively... we have issues)
    setValue((): SubmittableExtrinsicFunction<'promise'> => newValue);
    onChange(newValue);
  };

  return (
    <LinkedWrapper
      className={className}
      help={help}
      label={label}
      style={style}
      withLabel={withLabel}
    >
      <SelectMethod
        api={api}
        className='huge'
        onChange={_onKeyChange}
        options={optionsMethod}
        value={value}
      />
    </LinkedWrapper>
  );
}
