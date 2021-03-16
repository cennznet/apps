// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';
import React, { useMemo } from 'react';
import type { StakingLedger, ValidatorPrefs } from '@polkadot/types/interfaces';
import { AddressSmall, Icon, Modal } from '@polkadot/react-components';
import { useApi, useCall, useToggle } from '@polkadot/react-hooks';
import FormatBalance from '@polkadot/app-generic-asset/FormatBalance';
import type { NominatedBy as NominatedByType, ValidatorInfo } from '../../types';
import type { NominatorValue } from './types';
import Status from './Status';
import { poolRegistry } from "@polkadot/app-staking/Overview/Address/poolRegistry";
import { STAKING_ASSET_NAME } from "@polkadot/app-generic-asset/assetsRegistry";
import { colors } from '../../../../../styled-theming';
import styled from 'styled-components';

interface NominatorModalProps {
  nominators: NominatorValue[];
  onClose: () => void;
}

interface Props {
  address: string;
  className?: string;
  filterName: string;
  hasQueries: boolean;
  isElected: boolean;
  isFavorite: boolean;
  isMain?: boolean;
  lastBlock?: string;
  nominatedBy?: NominatedByType[];
  onlineCount?: false | BN;
  onlineMessage?: boolean;
  points?: string;
  toggleFavorite: (accountId: string) => void;
  validatorInfo?: ValidatorInfo;
  withIdentity: boolean;
  stakingLedger?: StakingLedger;
}

interface StakingState {
  commission?: string;
  nominators: NominatorValue[];
  stakeTotal?: BN;
  stakeOther?: BN;
  stakeOwn?: BN;
}

function expandInfo ({ exposure, validatorPrefs }: ValidatorInfo): StakingState {
  let nominators: NominatorValue[] = [];
  let stakeTotal: BN | undefined;
  let stakeOther: BN | undefined;
  let stakeOwn: BN | undefined;

  if (exposure) {
    nominators = exposure.others.map(({ value, who }) => ({ nominatorId: who.toString(), value: value.unwrap() }));
    stakeTotal = exposure.total.unwrap();
    stakeOwn = exposure.own.unwrap();
    stakeOther = stakeTotal.sub(stakeOwn);
  }

  const commission = (validatorPrefs as ValidatorPrefs)?.commission?.unwrap();

  return {
    commission: commission?.toHuman(),
    nominators,
    stakeOther,
    stakeOwn,
    stakeTotal
  };
}

const modalHeader = (<h2>top nominators<Icon></Icon></h2>);

function NominatedByModal_({ nominators } : NominatorModalProps): React.ReactElement<NominatorModalProps> | null {
  if(!nominators) return null;

  const [isVisible, setIsVisible] = useToggle(true);

  // sort by biggest first
  nominators.sort((a, b) => b.value.cmp(a.value));

  return (
    <Modal open={isVisible} header={modalHeader} style={{ marginTop: '10%', maxWidth: '700px' }}>
      <Modal.Content style={{ overflow: 'auto', maxHeight: '400px' }}>
          <table>
            <tbody>
            {nominators && nominators.length > 0 ? nominators?.slice(0, 128).map((n, index) => (
              <tr key={index} style={{ display: 'inline', marginRight: '2rem' }}>
                <td style={{ width: '2rem' }}>{index + 1}</td>
                <td style={{paddingRight: '10px'}}><AddressSmall value={n.nominatorId}/></td>
                <td><FormatBalance value={n.value} symbol={STAKING_ASSET_NAME}/></td>
              </tr>
            )) : (<h3>no nominations</h3>)}
            </tbody>
          </table>
      </Modal.Content>
      <Modal.Actions withOr={false} cancelLabel={'close'} onCancel={setIsVisible}>
      </Modal.Actions>
    </Modal>
  )
}

const NominatedByModal = styled(NominatedByModal_)`
    .ui.modal > .header {
      color: white;
      background: ${colors.N400} !important;
    }
`;

function Address ({ address, className = '', filterName, hasQueries, isElected, isFavorite, isMain, lastBlock, nominatedBy, onlineCount, onlineMessage, points, toggleFavorite, validatorInfo, withIdentity, stakingLedger }: Props): React.ReactElement<Props> | null {
  const { api } = useApi();
  const { nominators, stakeTotal } = useMemo(
    () => validatorInfo
      ? expandInfo(validatorInfo)
      : { nominators: [] },
    [validatorInfo]
  );
  const [viewNominators, toggleViewNominators] = useToggle(false);

  const chainInfo = useCall<string>(api.rpc.system.chain, []);
  const chain: string | undefined = chainInfo ? chainInfo.toString() : undefined;
  const pool = chain && poolRegistry[chain] && poolRegistry[chain][address] ? poolRegistry[chain][address] : 'Unknown';


  return (
      <tr className={className} onClick={toggleViewNominators}>
           <td className='address'>
               <AddressSmall value={address} />
           </td>
          <td className='address'>
              {pool}
          </td>
          <td className='badge together'>
              <Status
                  isElected={isElected}
                  isMain={isMain}
                  nominators={isMain ? nominators : nominatedBy}
                  onlineCount={onlineCount}
                  onlineMessage={onlineMessage}
              />
          </td>
          {isMain && (
              <td style={{width:'15%', whiteSpace:'nowrap'}}>
                <FormatBalance value={isElected ? stakeTotal : stakingLedger?.active?.toString()} symbol={STAKING_ASSET_NAME}/>
              </td>
          )}
          {viewNominators && <NominatedByModal onClose={toggleViewNominators} nominators={nominators}/>}
      </tr>
  );
}

export default React.memo(Address);
