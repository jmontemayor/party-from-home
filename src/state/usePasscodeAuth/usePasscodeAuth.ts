import { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

export function getStoredUser() {
  const match = window.location.search.match(/passcode=(.*)&?/);
  const storedUser = JSON.parse(window.sessionStorage.getItem('user') || '{}');
  const passcode = match ? { passcode: match[1] } : storedUser;
  return passcode;
}

export function fetchToken(name: string, room: string, passcode: string) {
  return fetch(`/api/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ identity: name, roomName: room, passcode }),
  });
}

export function verifyPasscode(passcode: string) {
  return fetchToken('temp-name', 'temp-room', passcode).then(async res => {
    const jsonResponse = await res.json();
    if (res.status === 401) {
      return { isValid: false, error: jsonResponse.error?.message };
    }

    if (res.ok && jsonResponse.token) {
      return { isValid: true };
    }
  });
}

export function getErrorMessage(message: string) {
  switch (message) {
    case 'passcode incorrect':
      return 'Passcode is incorrect';
    case 'passcode expired':
      return 'Passcode has expired';
    default:
      return message;
  }
}

export default function usePasscodeAuth() {
  const history = useHistory();

  const [user, setUser] = useState<{
    uid: string;
    displayName: undefined;
    photoURL: undefined;
    passcode: string;
  } | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const getToken = useCallback(
    (name: string, room: string) => {
      return fetchToken(name, room, user!.passcode)
        .then(res => res.json())
        .then(res => res.token as string);
    },
    [user]
  );

  useEffect(() => {
    const storedUser = getStoredUser();

    if (storedUser.passcode) {
      verifyPasscode(storedUser.passcode)
        .then(verification => {
          if (verification?.isValid) {
            setUser(storedUser);
            window.sessionStorage.setItem('user', JSON.stringify(storedUser));
            history.replace(window.location.pathname);
          }
        })
        .then(() => setIsAuthReady(true));
    } else {
      setIsAuthReady(true);
    }
  }, [history]);

  const signIn = useCallback((passcode: string) => {
    return verifyPasscode(passcode).then(verification => {
      if (verification?.isValid) {
        setUser({ passcode } as any);
        window.sessionStorage.setItem('user', JSON.stringify({ passcode }));
      } else {
        throw new Error(getErrorMessage(verification?.error));
      }
    });
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    window.sessionStorage.removeItem('user');
    return Promise.resolve();
  }, []);

  const setUserNameAvatar = (displayName: string, photoURL?: string) => {
    console.log('setting');
    const uid = user?.uid ? user.uid : new Date().getTime().toString();
    const newUser = { ...user, uid, displayName, photoURL };
    setUser(newUser as any);
    window.sessionStorage.setItem('user', JSON.stringify(newUser));
    return Promise.resolve();
  };

  return { user, setUser: setUserNameAvatar, isAuthReady, getToken, signIn, signOut };
}
