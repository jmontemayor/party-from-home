import React, { useState, useCallback, useEffect } from 'react';
import useMountEffect from '../../hooks/useMountEffect/useMountEffect';
import useMap from '../../hooks/useSync/useMap';
import useMapItems from '../../hooks/useSync/useMapItems';
import { styled } from '@material-ui/core/styles';
import { ExpandMore, ExpandLess } from '@material-ui/icons';
import { useAppState } from '../../state';
import useRoomState from '../../hooks/useRoomState/useRoomState';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import RoomGridItem from './RoomGridItem';

interface ContainerProps {
  open: boolean;
}

const Container = styled('div')((props: ContainerProps) => ({
  position: 'fixed',
  bottom: '0',
  left: '0',
  width: '100%',
  display: 'flex',
  flexShrink: 0,
  flexDirection: 'column',
  height: props.open ? '374px' : '70px',
  transition: 'height 0.2s ease-out',
}));

const HeaderContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '248px',
  marginTop: 0,
  marginLeft: '16px',
  cursor: 'pointer',
  padding: '21px',
  backgroundColor: theme.alternateBackgroundColor,
  borderRadius: '15px 15px 0 0',
}));

const BodyContainer = styled('div')(({ theme }) => ({
  backgroundColor: theme.alternateBackgroundColor,
  display: 'flex',
  flexShrink: 0,
  flexDirection: 'column',
  paddingTop: '32px',
  paddingLeft: '32px',
  height: '100%',
}));

const ContainerTitle = styled('p')({
  margin: 0,
  color: '#E0E0E0',
  fontSize: '24px',
  fontWeight: 600,
  lineHeight: '29px',
  alignItems: 'center',
});

const ItemContainer = styled('div')({
  display: 'flex',
  flexWrap: 'nowrap',
  overflowX: 'auto',
  flex: 1,
});

export interface Participant {
  uid: string;
  displayName: string | undefined;
  photoURL: string | undefined;
}

interface Participants {
  [key: string]: Participant[];
}

const HEARTBEAT_INTERVAL = 100000;

// todo(carlos): probably should be somewhere else, higher level,
// after we implement the auth flow
const heartbeat = (identity: string) => {
  return () => {
    fetch(`/api/heartbeat?identity=${identity}`).then(() => {
      console.log('Sent heartbeat');
    });
  };
};

interface HeaderProps {
  onClick: () => void;
  open: boolean;
}

const Header = (props: HeaderProps) => {
  return (
    <HeaderContainer onClick={props.onClick}>
      <ContainerTitle>Party Rooms</ContainerTitle>
      {props.open ? <ExpandMore fontSize="large" /> : <ExpandLess fontSize="large" />}
    </HeaderContainer>
  );
};

export default function RoomGrid() {
  const { getToken, user } = useAppState();
  const { connect, room } = useVideoContext();
  const roomState = useRoomState();
  const [participants, setParticipants] = useState({} as Participants);
  const [open, setOpen] = useState(false);
  const rooms = useMapItems('rooms');

  const onSelectRoom = useCallback(
    (id: string) => {
      if (roomState !== 'disconnected') room.disconnect();
      if (id !== undefined && id !== 'bathroom') getToken(user?.uid || '', id).then(token => connect(token));
      setOpen(false);
    },
    [roomState, room, getToken, user, connect]
  );

  const onUserAdded = useCallback(
    (args: any) => {
      const value = args.item.value;
      const roomParticipants = { ...participants };
      const roomId = value.room || 'bathroom';

      const par = {
        uid: value.identity,
        displayName: value.displayName,
        photoURL: value.photoURL,
      };

      if (roomParticipants[roomId] !== undefined) {
        roomParticipants[roomId].push(par);
      } else {
        roomParticipants[roomId] = [par];
      }

      setParticipants(roomParticipants);
    },
    [participants]
  );

  const onUserRemoved = useCallback(
    (item: any) => {
      const value = item.value;
      const roomParticipants = { ...participants };
      const roomId = value.room || 'bathroom';

      if (roomParticipants[roomId] !== undefined) {
        const roomUsers = roomParticipants[roomId];
        roomParticipants[roomId] = roomUsers.filter(u => u.uid !== value.identity);
      }

      setParticipants(roomParticipants);
    },
    [participants]
  );

  const onUserUpdated = useCallback(
    (args: any) => {
      const value = args.item.value;
      const roomParticipants = { ...participants };
      const roomId = value.room || 'bathroom';

      const par = {
        uid: value.identity,
        displayName: value.displayName,
        photoURL: value.photoURL,
      };

      for (const roomName in roomParticipants) {
        const roomUsers = roomParticipants[roomName];
        roomParticipants[roomName] = roomUsers.filter(u => u.uid !== value.identity);
      }

      if ('bathroom' in roomParticipants) {
        roomParticipants['bathroom'] = roomParticipants['bathroom'].filter(u => u.uid !== value.identity);
      }

      if (roomParticipants.hasOwnProperty(value.room)) {
        roomParticipants[roomId].push(par);
      } else {
        roomParticipants[roomId] = [par];
      }

      setParticipants(roomParticipants);
    },
    [participants]
  );

  const { map } = useMap('users', {
    onAdded: onUserAdded,
    onRemoved: onUserRemoved,
    onUpdated: onUserUpdated,
  });

  // todo(carlos): move this to app state
  useMountEffect(() => {
    setInterval(heartbeat(user?.uid || ''), HEARTBEAT_INTERVAL);
  });

  useEffect(() => {
    map?.getItems().then((paginator: any) => {
      const roomParticipants: Participants = {};

      paginator.items.forEach((item: any) => {
        const par = {
          uid: item.value.identity,
          displayName: item.value.displayName,
          photoURL: item.value.photoURL,
        };
        const roomId = item.value.room || 'bathroom';
        if (roomParticipants[roomId] !== undefined) {
          roomParticipants[roomId].push(par);
        } else {
          roomParticipants[roomId] = [par];
        }
      });

      setParticipants(roomParticipants);
    });
  }, [map]);

  const displayRooms: any[] = [];

  for (const id in rooms) {
    displayRooms.push(rooms[id]);
  }

  displayRooms.push({
    id: 'bathroom',
    name: 'Bathroom',
    description: 'This is the bathroom, take a break from the party.',
  });

  return (
    <Container open={open}>
      <Header onClick={() => setOpen(!open)} open={open} />
      <BodyContainer>
        <ItemContainer>
          {displayRooms.map((rm: any) => (
            <RoomGridItem
              key={rm.id}
              id={rm.id}
              title={rm.name}
              participants={participants[rm.id] || []}
              onClick={onSelectRoom}
            />
          ))}
        </ItemContainer>
      </BodyContainer>
    </Container>
  );
}
