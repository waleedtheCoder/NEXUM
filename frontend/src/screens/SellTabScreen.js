// SellTabScreen.js
// Smart Sell tab — shows MyListingsScreen for suppliers,
// or a "Become a Supplier" / "Sign Up to Sell" prompt for shopkeepers and guests.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';
import { fonts, spacing, radii } from '../constants/theme';
import MyListingsScreen from './MyListingsScreen';
import BottomNav from '../components/BottomNav';

export default function SellTabScreen() {
  const { isLoggedIn, role } = useUser();
  const isSupplier = isLoggedIn && (role === 'SUPPLIER' || role === 'supplier');

  if (isSupplier) return <MyListingsScreen />;

  return <SellPrompt isLoggedIn={isLoggedIn} />;
}

function SellPrompt({ isLoggedIn }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topBarTitle}>Sell on NEXUM</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name="storefront-outline" size={52} color={colors.primary} />
        </View>

        <Text style={styles.heading}>Become a Supplier</Text>
        <Text style={styles.subheading}>
          List your products and reach hundreds of shopkeepers across Pakistan.
        </Text>

        <View style={styles.perks}>
          {[
            { icon: 'trending-up-outline', text: 'Grow your wholesale business' },
            { icon: 'people-outline',      text: 'Connect with verified retailers' },
            { icon: 'shield-checkmark-outline', text: 'Secure payments & order management' },
          ].map((p) => (
            <View key={p.text} style={styles.perkRow}>
              <Ionicons name={p.icon} size={18} color={colors.primary} />
              <Text style={styles.perkText}>{p.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate(isLoggedIn ? 'BecomeSupplier' : 'SignUp')}
        >
          <Text style={styles.primaryBtnText}>
            {isLoggedIn ? 'Apply as Supplier' : 'Sign Up to Sell'}
          </Text>
        </TouchableOpacity>

        {!isLoggedIn && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('SavedAccountLogin')}
          >
            <Text style={styles.secondaryBtnText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      <BottomNav activeTab="sell" />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingBottom: 14,
  },
  topBarTitle: { color: '#fff', fontSize: 18, fontFamily: fonts.semiBold },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heading: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  perks: { width: '100%', gap: 10, marginVertical: 4 },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
  },
  perkText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  secondaryBtn: {
    paddingVertical: 8,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
