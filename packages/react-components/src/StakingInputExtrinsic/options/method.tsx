// Copyright 2017-2020 @polkadot/react-components authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { DropdownOption, DropdownOptions } from '../../util/types';

import React from 'react';
import { ApiPromise } from '@polkadot/api';

export default function createOptions (api: ApiPromise, sectionName: string): DropdownOptions {
  let section = {...api.tx[sectionName]};
  if (!section || Object.keys(section).length === 0) {
    return [];
  }
  // these methods require sudo or advanced knowledge
  const removeOperations = ["setValidatorCount", "reapStash", "validate", "forceNoEras", "forceNewEra", "setMinimumBond", "setInvulnerables", "forceUnstake", "forceNewEraAlways","cancelDeferredSlash","bond"];
  const stakingDocHelp: Record<string, any> = {
    "setController": ["Change controller account","Set the controller for this stash"],
    "nominate": ["Change nominations", "Nominate different validators for this stash"],
    "unbond": ["Unstake", "Unstake some or all CENNZ (time delayed)"],
    "withdrawUnbonded": ["Withdraw", "Withdraw unstaked CENNZ"],
    "setPayee": ["Change reward account", "Set the reward account for this stash"],
    "bondExtra": ["Add stake", "Add additional funds to an existing stake"],
    "rebond": ["Cancel withdrawal", "Cancel withdrawal of funds"],
    "chill": ["Chill", "Stop staking funds after this era"]
  };
  removeOperations.forEach(element => {
    delete section[element]
  });

  return Object
    .keys(section)
    .sort()
    .map((value): DropdownOption => {
      const method = section[value];

      return {
        className: 'ui--DropdownLinked-Item',
        key: `${sectionName}_${value}`,
        text: [
          <div
            className='ui--DropdownLinked-Item-call'
            key={`${sectionName}_${value}:call`}
          >
            {stakingDocHelp[value] ? stakingDocHelp[value][0] : value.charAt(0).toUpperCase() + value.slice(1)}
              </div>,
          <div
            className='ui--DropdownLinked-Item-text'
            key={`${sectionName}_${value}:text`}
          >
            {stakingDocHelp[value] ? stakingDocHelp[value][1] : (method.meta.documentation[0] || value).toString()}
          </div>
        ],
        value
      };
    });
}
