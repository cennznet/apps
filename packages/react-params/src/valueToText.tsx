// Copyright 2017-2020 @polkadot/react-components authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import { Balance, Keys, ValidatorId } from '@polkadot/types/interfaces';
import { classes, toFormattedBalance } from '@polkadot/react-components/util';
import { isNull, isUndefined, u8aToHex } from '@polkadot/util';
import { Option, Raw } from '@polkadot/types';

interface DivProps {
  className?: string;
  key?: any;
}

function div ({ key, className }: DivProps, ...values: React.ReactNode[]): React.ReactNode {
  return (
    <div
      className={classes('ui--Param-text', className)}
      key={key}
    >
      {values}
    </div>
  );
}

function formatKeys (keys: [ValidatorId, Keys][]): string {
  return JSON.stringify(
    keys.map(([validator, keys]): [string, string] => [
      validator.toString(), keys.toHex()
    ])
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function valueToText (type: string, value: any, swallowError = true, contentShorten = true): React.ReactNode {
  if (isNull(value) || isUndefined(value)) {
    return div({}, '<unknown>');
  }

  if (type === 'Balance') {
    return toFormattedBalance({ balance: (value as Balance).toBn() });
  }

  return div(
    {},
    ['Bytes', 'Raw', 'Option<Keys>', 'Keys'].includes(type)
      ? u8aToHex(value.toU8a(true), contentShorten ? 512 : -1)
      // HACK Handle Keys as hex-only (this should go away once the node value is
      // consistently swapped to `Bytes`)
      : type === 'Vec<(ValidatorId,Keys)>'
        ? JSON.stringify(formatKeys(value as [ValidatorId, Keys][]))
        : value instanceof Raw
          ? value.isEmpty
            ? '<empty>'
            : value.toString()
          : (value instanceof Option) && value.isNone
            ? '<none>'
            : JSON.stringify(value.toHuman())
  );
}
