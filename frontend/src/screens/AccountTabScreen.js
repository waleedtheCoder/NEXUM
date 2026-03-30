// AccountTabScreen.js
// Smart Account tab — renders the correct account screen based on auth/role state.
// Shown as Tab 5 in the bottom navigator.

import React from 'react';
import { useUser } from '../context/UserContext';
import GuestAccountScreen from './GuestAccountScreen';
import AccountSettingsScreen from './AccountSettingsScreen';
import SupplierAccountScreen from './SupplierAccountScreen';

export default function AccountTabScreen() {
  const { isLoggedIn, role } = useUser();

  if (!isLoggedIn) return <GuestAccountScreen />;

  const isSupplier = role === 'SUPPLIER' || role === 'supplier';
  if (isSupplier) return <SupplierAccountScreen />;

  return <AccountSettingsScreen />;
}
