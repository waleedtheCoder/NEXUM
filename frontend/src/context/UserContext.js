import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerFCMToken } from '../services/marketplaceApi';

const UserContext = createContext(null);

// ─── FCM token registration helper ───────────────────────────────────────────
// Called after a successful login. Asks for notification permission, gets the
// Expo push token, and registers it on the backend.
// Failures are swallowed — a failed token registration must never break login.
async function _registerPushToken(idToken, sessionId) {
  try {
    // Push notifications only work on a physical device
    if (!Device.isDevice) return;

    // Ask for permission (iOS prompts; Android grants automatically on API < 33)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // User denied — skip silently. We never block login for this.
      return;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data;

    await registerFCMToken(expoPushToken, { idToken, sessionId });
  } catch (err) {
    // Never let push-token failures surface to the user
    console.warn('[FCM] Failed to register push token:', err?.message || err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function UserProvider({ children }) {
  const [user, setUser]                     = useState(null);
  const [role, setRole]                     = useState(null);
  const [sessionId, setSessionId]           = useState(null);
  const [idToken, setIdToken]               = useState(null);
  const [refreshToken, setRefreshToken]     = useState(null);
  const [isLoading, setIsLoading]           = useState(true);

  const isLoggedIn = !!sessionId;

  // Load session data from AsyncStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [sid, userData, userRole, idTok, refreshTok] = await Promise.all([
          AsyncStorage.getItem('session_id'),
          AsyncStorage.getItem('user_data'),
          AsyncStorage.getItem('user_role'),
          AsyncStorage.getItem('id_token'),
          AsyncStorage.getItem('refresh_token'),
        ]);

        if (sid)        setSessionId(sid);
        if (userData)   setUser(JSON.parse(userData));
        if (userRole)   setRole(userRole);
        if (idTok)      setIdToken(idTok);
        if (refreshTok) setRefreshToken(refreshTok);
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  // Login — persists session + saves email/name for LoginSelectionScreen,
  // then registers the FCM token in the background.
  const login = async (sid, userData, userRole, tokens = {}) => {
    try {
      const pairs = [
        ['session_id', sid],
        ['user_data',  JSON.stringify(userData)],
        ['user_role',  userRole || 'shopkeeper'],
      ];

      if (tokens.idToken)      pairs.push(['id_token',      tokens.idToken]);
      if (tokens.refreshToken) pairs.push(['refresh_token', tokens.refreshToken]);

      // Persist email/name separately — these survive logout so
      // LoginSelectionScreen can show the last signed-in account
      if (userData?.email) pairs.push(['saved_email', userData.email]);
      if (userData?.name)  pairs.push(['saved_name',  userData.name]);

      await AsyncStorage.multiSet(pairs);

      setSessionId(sid);
      setUser(userData);
      setRole(userRole || 'shopkeeper');
      setIdToken(tokens.idToken || null);
      setRefreshToken(tokens.refreshToken || null);

      // Register FCM token after login — fire-and-forget, never blocks login
      _registerPushToken(tokens.idToken, sid);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  // Logout — clears session but intentionally keeps saved_email and saved_name
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'session_id',
        'user_data',
        'user_role',
        'id_token',
        'refresh_token',
      ]);
      // saved_email and saved_name are NOT removed here on purpose

      setSessionId(null);
      setUser(null);
      setRole(null);
      setIdToken(null);
      setRefreshToken(null);
    } catch (e) {
      console.error('Failed to clear session:', e);
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

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used inside UserProvider');
  return context;
}