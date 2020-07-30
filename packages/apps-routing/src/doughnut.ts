// Copyright 2017-2020 @polkadot/apps-routing authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Routes } from './types';

import Doughnut from '@cennznet/app-doughnut';
import { faCertificate } from '@fortawesome/free-solid-svg-icons';

export default ([
  {
    Component: Template,
    display: {
      isHidden: false,
      needsAccounts: true,
      needsApi: []
    },
    i18n: {
      defaultValue: 'Doughnut'
    },
    icon: faCertificate,
    name: 'doughnut',
    isAdvanced: false
  }
] as Routes);
