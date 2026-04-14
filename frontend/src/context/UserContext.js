import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAnonymousSession,
  logoutFromBackend,
  rotateSessionWithBackend,
} from '../services/authApi';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [guestSessionId, setGuestSessionId] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!(sessionId && idToken && user);

  // Load session data from AsyncStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [sid, guestSid, userData, userRole, idTok, refreshTok] = await Promise.all([
          AsyncStorage.getItem('session_id'),
          AsyncStorage.getItem('guest_session_id'),
          AsyncStorage.getItem('user_data'),
          AsyncStorage.getItem('user_role'),
          AsyncStorage.getItem('id_token'),
          AsyncStorage.getItem('refresh_token'),
        ]);

        let parsedUser = null;
        if (userData) {
          try {
            parsedUser = JSON.parse(userData);
          } catch (err) {
            parsedUser = null;
          }
        }

        if (sid && idTok && parsedUser) {
          let nextSessionId = sid;
          try {
            const rotated = await rotateSessionWithBackend({ sessionId: sid, idToken: idTok });
            if (rotated?.session_id) {
              nextSessionId = rotated.session_id;
              await AsyncStorage.setItem('session_id', nextSessionId);
            }
          } catch (err) {
            console.warn('Failed to rotate auth session. Keeping previous session id.', err);
          }

          await AsyncStorage.removeItem('guest_session_id');

          setSessionId(nextSessionId);
          setGuestSessionId(null);
          setUser(parsedUser);
          setRole(userRole || 'shopkeeper');
          setIdToken(idTok);
          setRefreshToken(refreshTok || null);
        } else {
          await AsyncStorage.multiRemove([
            'session_id',
            'user_data',
            'user_role',
            'id_token',
            'refresh_token',
          ]);

          setSessionId(null);
          setUser(null);
          setRole(null);
          setIdToken(null);
          setRefreshToken(null);

          let nextGuestSessionId = guestSid;
          try {
            const guest = await getAnonymousSession();
            if (guest?.session_id) {
              nextGuestSessionId = guest.session_id;
              await AsyncStorage.setItem('guest_session_id', nextGuestSessionId);
            }
          } catch (err) {
            if (!nextGuestSessionId) {
              nextGuestSessionId = `guest-${Date.now()}`;
              await AsyncStorage.setItem('guest_session_id', nextGuestSessionId);
            }
          }

          setGuestSessionId(nextGuestSessionId || null);
        }
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setIsLoading(false); // Always run
      }
    };

    loadSession();
  }, []);

  // Login function
  const login = async (sid, userData, userRole, tokens = {}) => {
    try {
      const pairs = [
        ['session_id', sid],
        ['user_data', JSON.stringify(userData)],
        ['user_role', userRole || 'shopkeeper'],
      ];

      if (tokens.idToken) pairs.push(['id_token', tokens.idToken]);
      if (tokens.refreshToken) pairs.push(['refresh_token', tokens.refreshToken]);

      await AsyncStorage.multiSet(pairs);
      await AsyncStorage.removeItem('guest_session_id');

      setSessionId(sid);
      setGuestSessionId(null);
      setUser(userData);
      setRole(userRole || 'shopkeeper');
      setIdToken(tokens.idToken || null);
      setRefreshToken(tokens.refreshToken || null);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  // Logout function
  const logout = async () => {
    const currentSessionId = sessionId;
    try {
      await AsyncStorage.multiRemove([
        'session_id',
        'user_data',
        'user_role',
        'id_token',
        'refresh_token',
      ]);

      setSessionId(null);
      setGuestSessionId(null);
      setUser(null);
      setRole(null);
      setIdToken(null);
      setRefreshToken(null);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
    // Invalidate the session on the server (best-effort, non-blocking).
    logoutFromBackend(currentSessionId);

    try {
      const guest = await getAnonymousSession();
      const newGuestSessionId = guest?.session_id || `guest-${Date.now()}`;
      await AsyncStorage.setItem('guest_session_id', newGuestSessionId);
      setGuestSessionId(newGuestSessionId);
    } catch (e) {
      const fallbackGuestSessionId = `guest-${Date.now()}`;
      await AsyncStorage.setItem('guest_session_id', fallbackGuestSessionId);
      setGuestSessionId(fallbackGuestSessionId);
    }
  };

  // Update user data
  const updateUser = async (updatedData) => {
    const merged = { ...user, ...updatedData };
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(merged));
      setUser(merged);
    } catch (e) {
      console.error('Failed to update user:', e);
    }
  };

  // Set user role
  const setUserRole = async (newRole) => {
    try {
      await AsyncStorage.setItem('user_role', newRole);
      setRole(newRole);
    } catch (e) {
      console.error('Failed to save role:', e);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        role,
        sessionId,
        guestSessionId,
        idToken,
        refreshToken,
        isLoggedIn,
        isLoading,
        login,
        logout,
        updateUser,
        setUserRole,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Hook to use user context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used inside UserProvider');
  return context;
}