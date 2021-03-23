// Copyright 2017-2020 @polkadot/react-components authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { BaseProps, Props as CProps, ComponentMap } from '../types';

import React, { useRef } from 'react';
import { classes } from '@polkadot/react-components/util';

import findComponent from './findComponent';
import Static from './Static';
import { InputBalance } from '@polkadot/react-components';
import { AssetRegistry } from '@polkadot/app-generic-asset/assetsRegistry';

interface Props extends BaseProps {
  isDisabled?: boolean;
  isOptional?: boolean;
  overrides?: ComponentMap;
  assetIdContext?: string;
}

export default function Param ({ className, defaultValue, isDisabled, isOptional, name, onChange, onEnter, onEscape, overrides, style, type, assetIdContext }: Props): React.ReactElement<Props> | null {
  const compRef = useRef<React.ComponentType<CProps> | null>(findComponent(type, overrides));

  if (!compRef.current) {
    return null;
  }

  const label = name;

  // TODO: this is a quick hack
  // Balance component is being rendered in context of a specific asset Id
  if(type.type.includes('Balance') && assetIdContext) {
    return (<InputBalance
      defaultValue={defaultValue.value}
      isDisabled={true}
      label={label}
      style={style}
      decimals={new AssetRegistry().get(assetIdContext)?.decimals}
    />);
  }

  return isOptional
    ? (
      <Static
        defaultValue={defaultValue}
        label={label}
        type={type}
      />
    )
    : (
      <compRef.current
        className={classes('ui--Param', className)}
        defaultValue={defaultValue}
        key={name}
        isDisabled={isDisabled}
        label={label}
        name={name}
        onChange={onChange}
        onEnter={onEnter}
        onEscape={onEscape}
        overrides={overrides}
        style={style}
        type={type}
      />
    );
}
