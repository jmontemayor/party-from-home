import React from 'react';
import { styled } from '@material-ui/core';
import useCurrentRoom from '../../../hooks/useCurrentRoom/useCurrentRoom';
import PopOverWithButton, { BUTTON_TYPE_INFO } from '../../shared/PopOverWithButton/PopOverWithButton';

const IconContainer = styled('div')(({ theme }) => ({
  marginLeft: theme.spacing(1.5),
}));

const RoomRulesTitle = styled('div')({
  color: '#F2F2F2',
  fontSize: '20px',
  fontWeight: 600,
  lineHeight: '24px',
});

const RoomRulesContent = styled('div')({
  color: '#BEBEBE',
  fontSize: '16px',
  marginTop: 0,
});

export default function RoomInfoButtonAndPopOver() {
  const currentRoom = useCurrentRoom();
  const roomTitle = currentRoom?.name ? `Rules for the ${currentRoom.name}` : 'Room rules';
  const roomDescription = currentRoom?.description || 'No description was provided...this is a mystery room.';

  return (
    <IconContainer>
      <PopOverWithButton buttonType={BUTTON_TYPE_INFO} popOverId="room-info-popover">
        <RoomRulesTitle>{roomTitle}</RoomRulesTitle>
        <RoomRulesContent>{roomDescription}</RoomRulesContent>
      </PopOverWithButton>
    </IconContainer>
  );
}
