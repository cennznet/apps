// Copyright 2017-2020 @polkadot/apps-routing authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Routes } from './types';

import Staking from '@polkadot/app-staking';
import { faCoins } from '@fortawesome/free-solid-svg-icons';

export default ([
  {
    Component: Staking,
    display: {
      needsApi: [
        [
          'tx.staking.bond' // current bonding API
        ]
      ]
    },
    i18n: {
      defaultValue: 'Staking'
    },
    icon: faCoins,
    name: 'staking',
    isAdvanced: false
  }
] as Routes);
