// Copyright 2017-2020 @polkadot/react-query authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { BareProps } from '@polkadot/react-api/types';

import React from 'react';
import { useApi } from '@polkadot/react-hooks';

interface Props extends BareProps {
  children?: React.ReactNode;
  label?: React.ReactNode;
}

export default function NodeVersion ({ children, className, label, style }: Props): React.ReactElement<Props> {
  const { systemVersion } = useApi();
  // change version 1.2.0-rc1-4827374-x86_64-linux-gnu to 1.2.0
  const nodeVer = systemVersion.split('-')

  return (
    <div
      className={className}
      style={style}
    >
      {label || ''}{nodeVer[0]}{children}
    </div>
  );
}
