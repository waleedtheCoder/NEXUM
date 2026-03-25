import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!sessionId;

  useEffect(() => {
  const loadSession = async () => {
    try {
      const [sid, userData, userRole] = await Promise.all([
        AsyncStorage.getItem('session_id'),
        AsyncStorage.getItem('user_data'),
        AsyncStorage.getItem('user_role'),
      ]);
      if (sid) setSessionId(sid);
      if (userData) setUser(JSON.parse(userData));
      if (userRole) setRole(userRole);
    } catch (e) {
      // ignore errors on web
    } finally {
      setIsLoading(false);  // ← this MUST always run
    }
  };
  loadSession();
}, []);

  const login = async (sid, userData, userRole) => {
    try {
      await AsyncStorage.multiSet([
        ['session_id', sid],
        ['user_data', JSON.stringify(userData)],
        ['user_role', userRole || 'shopkeeper'],
      ]);
      setSessionId(sid);
      setUser(userData);
      setRole(userRole || 'shopkeeper');
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['session_id', 'user_data']);
      setSessionId(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  };

  const updateUser = async (updatedData) => {
    const merged = { ...user, ...updatedData };
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(merged));
      setUser(merged);
    } catch (e) {
      console.error('Failed to update user:', e);
    }
  };

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
