import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerFCMToken } from '../services/marketplaceApi';

const UserContext = createContext(null);

// ─── FCM token registration helper ───────────────────────────────────────────
async function _registerPushToken(idToken, sessionId) {
  try {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    await registerFCMToken(tokenData.data, { idToken, sessionId });
  } catch (err) {
    console.warn('[FCM] Failed to register push token:', err?.message || err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export function UserProvider({ children }) {
  const [user, setUser]                 = useState(null);
  const [role, setRole]                 = useState(null);
  const [sessionId, setSessionId]       = useState(null);
  const [idToken, setIdToken]           = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading]       = useState(true);

  // ── Theme state ─────────────────────────────────────────────────────────────
  // Stored under 'nexum_theme' — a separate key that is intentionally NOT
  // cleared on logout. The user's theme preference should survive across
  // account switches and logouts.
  const [isDark, setIsDark] = useState(false);

  const isLoggedIn = !!sessionId;

  // ── Restore session + theme on mount ────────────────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [sid, userData, userRole, idTok, refreshTok, themeVal] = await Promise.all([
          AsyncStorage.getItem('session_id'),
          AsyncStorage.getItem('user_data'),
          AsyncStorage.getItem('user_role'),
          AsyncStorage.getItem('id_token'),
          AsyncStorage.getItem('refresh_token'),
          AsyncStorage.getItem('nexum_theme'),   // ← theme key
        ]);

        if (sid)       setSessionId(sid);
        if (userData)  setUser(JSON.parse(userData));
        if (userRole)  setRole(userRole);
        if (idTok)     setIdToken(idTok);
        if (refreshTok) setRefreshToken(refreshTok);
        if (themeVal === 'dark') setIsDark(true);   // default is light
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  // ── Toggle theme ─────────────────────────────────────────────────────────────
  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem('nexum_theme', next ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to persist theme preference:', e);
    }
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (sid, userData, userRole, tokens = {}) => {
    try {
      const pairs = [
        ['session_id', sid],
        ['user_data',  JSON.stringify(userData)],
        ['user_role',  userRole || 'shopkeeper'],
      ];

      if (tokens.idToken)      pairs.push(['id_token',      tokens.idToken]);
      if (tokens.refreshToken) pairs.push(['refresh_token', tokens.refreshToken]);

      if (userData?.email) pairs.push(['saved_email', userData.email]);
      if (userData?.name)  pairs.push(['saved_name',  userData.name]);

      await AsyncStorage.multiSet(pairs);

      setSessionId(sid);
      setUser(userData);
      setRole(userRole || 'shopkeeper');
      setIdToken(tokens.idToken || null);
      setRefreshToken(tokens.refreshToken || null);

      _registerPushToken(tokens.idToken, sid);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  // ── Logout — clears auth but intentionally keeps theme + saved account ──────
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'session_id',
        'user_data',
        'user_role',
        'id_token',
        'refresh_token',
        // 'nexum_theme' is NOT removed — theme persists through logout
        // 'saved_email' and 'saved_name' are also kept for LoginSelectionScreen
      ]);

      setSessionId(null);
      setUser(null);
      setRole(null);
      setIdToken(null);
      setRefreshToken(null);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  };

  // ── Update user data ──────────────────────────────────────────────────────
  const updateUser = async (updatedData) => {
    const merged = { ...user, ...updatedData };
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(merged));
      setUser(merged);
    } catch (e) {
      console.error('Failed to update user:', e);
    }
  };

  // ── Set user role ─────────────────────────────────────────────────────────
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
        // Auth
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
        // Theme
        isDark,
        toggleTheme,
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