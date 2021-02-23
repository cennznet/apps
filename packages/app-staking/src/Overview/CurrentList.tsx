// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useMemo, useState } from 'react';
import type { DeriveHeartbeats, DeriveStakingOverview } from '@polkadot/api-derive/types';
import type { AccountId } from '@polkadot/types/interfaces';
import { LabelHelp, Table } from '@polkadot/react-components';
import { useApi, useCall } from '@polkadot/react-hooks';
import { BlockAuthorsContext } from '@polkadot/react-query';

import useNominations from '../useNominations';
import Address from './Address';
import { SortedTargets, ValidatorInfo } from "@polkadot/app-staking/types";
import styled from "styled-components";
import { useTranslation } from "@polkadot/app-staking/translate";
import { colors } from '../../../../styled-theming';

interface Props {
  favorites: string[];
  hasQueries: boolean;
  next?: string[];
  stakingOverview?: DeriveStakingOverview;
  targets: SortedTargets;
  toggleFavorite: (address: string) => void;
}

type AccountExtend = [string, boolean, boolean];

interface Filtered {
  elected?: AccountExtend[];
  validators?: AccountExtend[];
  waiting?: AccountExtend[];
}

function filterAccounts (accounts: string[] = [], elected: string[], favorites: string[], without: string[]): AccountExtend[] {
  return accounts
      .filter((accountId) => !without.includes(accountId))
      .map((accountId): AccountExtend => [
        accountId,
        elected.includes(accountId),
        favorites.includes(accountId)
      ])
      .sort(([,, isFavA]: AccountExtend, [,, isFavB]: AccountExtend) =>
          isFavA === isFavB
              ? 0
              : (isFavA ? -1 : 1)
      );
}

function accountsToString (accounts: AccountId[]): string[] {
  return accounts && accounts.map((accountId) => accountId.toString());
}

function getFiltered (stakingOverview: DeriveStakingOverview, favorites: string[], next?: string[]): Filtered {
  const allElected = accountsToString(stakingOverview.nextElected);
  const validatorIds = accountsToString(stakingOverview.validators);
  const validators = filterAccounts(validatorIds, allElected, favorites, []);
  const elected = filterAccounts(allElected, allElected, favorites, validatorIds);
  const waiting = filterAccounts(next, [], favorites, allElected);

  return {
    elected,
    validators,
    waiting
  };
}

function CurrentList ({ favorites, hasQueries, next, stakingOverview, targets, toggleFavorite }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const { api } = useApi();
  const { byAuthor, eraPoints } = useContext( BlockAuthorsContext);
  const recentlyOnline = useCall<DeriveHeartbeats>(api.derive.imOnline?.receivedHeartbeats);
  const nominatedBy = useNominations(false);
  const [nameFilter] = useState<string>('');
  const [withIdentity] = useState(false);
  const { validators } = useMemo(
      () => stakingOverview ? getFiltered(stakingOverview, favorites, next) : {},
      [favorites, next, stakingOverview]
  );

  const infoMap = useMemo(
      () => targets?.validators?.reduce((result: Record<string, ValidatorInfo>, info): Record<string, ValidatorInfo> => {
        result[info.accountId.toString()] = info;

        return result;
      }, {}),
      [targets]
  );
  const _renderRows = useCallback(
      (addresses?: AccountExtend[], isMain?: boolean): React.ReactNode[] =>
          (addresses || []).map(([address, isElected, isFavorite]): React.ReactNode => (
              <Address
                  address={address}
                  filterName={nameFilter}
                  hasQueries={hasQueries}
                  isElected={isElected}
                  isFavorite={isFavorite}
                  isMain={isMain}
                  key={address}
                  lastBlock={byAuthor[address]}
                  nominatedBy={nominatedBy ? (nominatedBy[address] || []) : undefined}
                  onlineCount={recentlyOnline?.[address]?.blockCount}
                  onlineMessage={recentlyOnline?.[address]?.hasMessage}
                  points={eraPoints[address]}
                  toggleFavorite={toggleFavorite}
                  validatorInfo={infoMap?.[address]}
                  withIdentity={withIdentity}
              />
          )),
      [byAuthor, eraPoints, hasQueries, infoMap, nameFilter, nominatedBy, recentlyOnline, toggleFavorite, withIdentity]
  );

  return (
  <StyledTable>
    <thead>
    <tr>
      <th>{t('Validator')}</th>
      <th>{t('Pool')}</th>
      <th>{t('Status')}</th>
      <th>
        {t('Total Staked')}
        <LabelHelp
          help={t('Total stake supporting this validator. It includes all nominator contributions and its own')}
        />
      </th>
    </tr>
    </thead>
    <tbody>
      {infoMap ? _renderRows(validators, true): undefined}
    </tbody>
  </StyledTable>
  )
}

export default React.memo(CurrentList);

const StyledTable = styled(Table)`
  width: 50%;
  font-size: 15px;

  th {
    background: ${colors.primary} !important;
    text-align: left !important;
  }

  td:first-child {
    border-top-left-radius: 10px !important;;
    border-bottom-left-radius: 10px !important;;
  }

  td:last-child {
    border-top-right-radius: 10px !important;;
    border-bottom-right-radius: 10px !important;;
  }
`;