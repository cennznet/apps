// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';
import React, { useMemo } from 'react';

import { StakingBadge, Icon } from '@polkadot/react-components';
import { useAccounts } from '@polkadot/react-hooks';

import MaxBadge from '../../MaxBadge';

interface Props {
  isElected: boolean;
  isMain?: boolean;
  nominators?: { nominatorId: string }[];
  onlineCount?: false | BN;
  onlineMessage?: boolean;
}

function Status ({ isElected, isMain, nominators = [], onlineCount, onlineMessage }: Props): React.ReactElement<Props> {
  const { allAccounts } = useAccounts();
  const blockCount = onlineCount && onlineCount.toNumber();

  const isNominating = useMemo(
    () => nominators.some(({ nominatorId }) => allAccounts.includes(nominatorId)),
    [allAccounts, nominators]
  );

  return (
    <>
      {isNominating
        ? (
          <StakingBadge
            color='green'
            icon='hand-paper'
            hover='validator has support from some nominators'
          />
        )
        : null
      }
      {(
          <StakingBadge
            color={isElected ? 'green' : 'yellow'}
            icon='chevron-right'
            hover='validator elected status: elected 🟢 / candidate 🟡'
          />
        )
      }
      {isMain && (
        blockCount || onlineMessage
          ? (
            <StakingBadge
              color='blue'
              hover={`validator is online and has authored ${blockCount} blocks`}
              info={blockCount || <Icon icon='envelope'
            />
        }
            />
          )
          : null
      )}
      <MaxBadge numNominators={nominators.length} />
    </>
  );
}

export default React.memo(Status);
