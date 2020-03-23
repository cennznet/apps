import React from 'react';
import styled from 'styled-components';
import { Button } from '@polkadot/react-components';
import { Responsive } from 'semantic-ui-react';
import { SIDEBAR_MENU_THRESHOLD } from '../constants';
import { colors } from '../../../../styled-theming';

interface Props {
  collapse: () => void;
}

const ToggleButton = styled(Button).attrs({
  className: 'apps--SideBar-toggle'
})`
  height: 100%;
  position: absolute;
  right: 0px;
  top: 0px;
  transition: all 0.2s;
  width: 6px;

  &:hover {
    background: rgba(255,255,255,0.15);
    cursor: pointer;
  }
`;

function SideBarToggle ({ collapse }: Props): React.ReactElement<Props> {
  return (
    <Responsive minWidth={SIDEBAR_MENU_THRESHOLD}>
      <ToggleButton onClick={collapse} />
    </Responsive>
  );
}

export default SideBarToggle;
