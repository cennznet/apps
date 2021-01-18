// Copyright 2017-2020 @polkadot/app-accounts authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.
import styled from 'styled-components';
import React from 'react';
import { Modal } from '@polkadot/react-components';
import { useTranslation } from '../translate';
import { Link } from "react-router-dom";
import { colors } from '../../../../styled-theming';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface Props {
  className?: string;
  closeNoAccountsPopUp: Function;
}

const ModalHeader = styled.div`
  font-size: 1.5em;
  font-weight: bold;
`;

const Paragraph = styled.div`
  line-height: 1.5rem;
  font-weight: normal;
`;

const Modaldiv = styled.div`
  padding: 0px 0px 60px 0px;
  a {
    float:left;
    clear: left;
    height: 20px;
    font-weight: normal;
  }
`;

function AccountCheckingModal ({className, closeNoAccountsPopUp }: Props): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Modal className={className}>
      <FontAwesomeIcon style={{marginLeft:"97%", marginTop:"1%"}} icon={faTimes} size="1x"
                       onClick={() => {
                         closeNoAccountsPopUp();
                       }}/>
      <Modal.Content className='content'>
        <ModalHeader>{t('No accounts available')}</ModalHeader>
        <Paragraph>{t('You do not have any accounts for a new nomination, try:')}</Paragraph>
        <Modaldiv className='info'>
          <Link to={`/accounts`}>{'Create a new account'}</Link>
          <Link to={`/staking/manage`}>{'Manage existing stake'}</Link>
        </Modaldiv>
      </Modal.Content>
    </Modal>
  );
}
export default styled(AccountCheckingModal)`
background: ${colors.lightBrown} !important;
border: solid 2px #d09c4e !important;
.content {
  margin-left: 2rem;
  color: rgb(95 50 3 / 87%);
  line-height: 2.5rem;
  font-size: 1.2rem !important;
}
`;
