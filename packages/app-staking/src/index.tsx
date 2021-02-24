// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AppProps as Props } from '@polkadot/react-components/types';
import React, {  useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Route, Switch } from 'react-router';
import Tabs from '@polkadot/react-components/Tabs';
import { useAccounts, useCall, useApi, useFavorites, useStashIds } from '@polkadot/react-hooks';
import NewStake from './NewStake';
import Overview from './Overview';
import Summary from './Overview/Summary';
import useSortedTargets from './useSortedTargets';
import { STORE_FAVS_BASE } from './constants';
import { useTranslation } from './translate';
import { Balance, FixedI128 } from '@polkadot/types/interfaces';
import { toFormattedBalance } from "@polkadot/react-components/util";
import { formatBalance } from '@polkadot/util';
import BN from "bn.js";
import MyStake from './MyStake';

export default function ToolboxApp ({ basePath }: Props): React.ReactElement<Props> {
    const { t } = useTranslation();
    const { api } = useApi();
    const { allAccounts, hasAccounts } = useAccounts();
    const { pathname } = useLocation();
    const allStashes = useStashIds();
    const stakingOverview = useCall<any>(api.derive.staking.overview, []);
    const transactionFeePot = useCall<Balance>(api.query.rewards.transactionFeePot, []);
    const baseInflation = useCall<FixedI128>(api.query.rewards.targetInflationPerStakingEra, []);
    const calcRewards = transactionFeePot && baseInflation ?
        transactionFeePot.toBn().add(baseInflation.toBn()) : new BN(0);
    const rewards = toFormattedBalance({
        value: calcRewards as BN,
        unit: formatBalance.getDefaults().unit
    });

    const next = useMemo(
        () => (allStashes && stakingOverview)
            ? allStashes.filter((address) => !stakingOverview.validators.includes(address as any))
            : undefined,
        [allStashes, stakingOverview]
    );
    const [favorites, toggleFavorite] = useFavorites(STORE_FAVS_BASE);
    const targets = useSortedTargets(favorites);
    const hasQueries = useMemo(
        () => hasAccounts && !!(api.query.imOnline?.authoredBlocks) && !!(api.query.staking.activeEra),
        [api, hasAccounts]
    );

    const items = useMemo(() => [
        {
            isRoot: true,
            name: 'overview',
            text: t('Overview')
        },
        {
          name: 'mystake',
          text: t('My Stake')
        },
        {
            name: 'stake',
            text: t('New Stake')
        },
    ], [t]);

    return (
        <main className='staking--App'>
            <header>
                <Tabs
                    basePath={basePath}
                    items={items}
                />
            </header>
            {pathname === `/staking` ?
                (
                    <Summary
                        isVisible={pathname === basePath}
                        next={next}
                        nominators={targets.nominators}
                        stakingOverview={stakingOverview}
                        rewards={rewards}
                    />
                ):
                null
            }
            <Switch>
                <Route path={`${basePath}/overview`}>
                    <Overview
                        favorites={favorites}
                        hasQueries={hasQueries}
                        next={next}
                        stakingOverview={stakingOverview}
                        targets={targets}
                        toggleFavorite={toggleFavorite}
                    />
                </Route>
                <Route path={`${basePath}/stake`} component={NewStake} />
                <Route path={`${basePath}/mystake`}>
                    <MyStake accounts={allAccounts}/>
                </Route>
                <Route>
                    <Overview
                        favorites={favorites}
                        hasQueries={hasQueries}
                        next={next}
                        stakingOverview={stakingOverview}
                        targets={targets}
                        toggleFavorite={toggleFavorite}
                    />
                </Route>
            </Switch>
        </main>
    );
}
