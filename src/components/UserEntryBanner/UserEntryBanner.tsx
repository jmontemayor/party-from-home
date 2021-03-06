import React, { useCallback, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Snackbar, styled } from '@material-ui/core';
import useMap from '../../hooks/useSync/useMap';

const useStyles = makeStyles(theme => ({
  snackbarOverride: {
    '& > div': {
      background: theme.palette.background.default,
      boxShadow: 'none',
    },
  },
}));

const MessageText = styled('div')({
  color: '#FFFFFF',
  fontSize: '16px',
});

export default function UserEntryBanner() {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    setOpen(false);
  };

  const userAdded = useCallback((args: any) => {
    const user = args.item.value;
    if (user && user.displayName) {
      setOpen(true);
      setMessage('\uD83C\uDF89 ' + user.displayName + ' joined the party! \uD83C\uDF89');
    }
  }, []);

  const userRemoved = useCallback((item: any) => {
    const user = item.value;
    if (user && user.displayName) {
      setOpen(true);
      setMessage('\uD83E\uDD7A ' + user.displayName + ' left the party \uD83E\uDD7A');
    }
  }, []);

  useMap('users', {
    onAdded: userAdded,
    onRemoved: userRemoved,
  });

  return (
    <div>
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        className={classes.snackbarOverride}
        message={
          <>
            <MessageText>{message}</MessageText>
          </>
        }
        ClickAwayListenerProps={{ mouseEvent: false }}
      />
    </div>
  );
}
