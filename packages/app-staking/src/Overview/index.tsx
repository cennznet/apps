// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { BareProps } from '@polkadot/react-components/types';

import React from 'react';
import {DeriveStakingOverview} from "@polkadot/react-api/staking/types";
import CurrentList from "@polkadot/app-staking/Overview/CurrentList";
import {SortedTargets} from "@polkadot/app-staking/types";

interface Props extends BareProps {
  className?: string;
  favorites: string[];
  hasQueries: boolean;
  next?: string[];
  stakingOverview?: DeriveStakingOverview;
  targets: SortedTargets;
  toggleFavorite: (address: string) => void;
}

export default function Overview({ className = '', favorites, hasQueries, next, stakingOverview, targets, toggleFavorite }: Props): React.ReactElement<Props> {
  return (
      <div className={`staking--Overview ${className}`}>
        <CurrentList
            favorites={favorites}
            hasQueries={true}
            next={next}
            stakingOverview={stakingOverview}
            targets={targets}
            toggleFavorite={toggleFavorite}
        />
    </div>
  );
}