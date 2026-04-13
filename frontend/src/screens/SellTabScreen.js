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
import { useLanguage } from '../hooks/useLanguage';
import { fonts, spacing, radii } from '../constants/theme';
import BubblyButton from '../components/BubblyButton';
import MyListingsScreen from './MyListingsScreen';
import BottomNav from '../components/BottomNav';

export default function SellTabScreen() {
  const { isLoggedIn, role } = useUser();
  const isSupplier = isLoggedIn && (role === 'SUPPLIER' || role === 'supplier');

  if (isSupplier) return <MyListingsScreen />;

  return <SellPrompt isLoggedIn={isLoggedIn} />;
}

const PERKS = (t) => [
  { icon: 'trending-up-outline',      text: t.sellTab.benefit1, bg: '#E6F4FF', color: '#0F766E' },
  { icon: 'people-outline',           text: t.sellTab.benefit2, bg: '#F3E8FF', color: '#9333EA' },
  { icon: 'shield-checkmark-outline', text: t.sellTab.benefit3, bg: '#F0FDF4', color: '#22C55E' },
];

function SellPrompt({ isLoggedIn }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, isUrdu } = useLanguage();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topBarTitle}>{t.sellTab.title}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name="storefront-outline" size={52} color={colors.primary} />
        </View>

        <Text style={styles.heading}>{t.sellTab.becomeSupplier}</Text>
        <Text style={styles.subheading}>{t.sellTab.subtitle}</Text>

        <View style={styles.perks}>
          {PERKS(t).map((p) => (
            <View key={p.text} style={styles.perkRow}>
              <View style={[styles.perkIconWrap, { backgroundColor: p.bg }]}>
                <Ionicons name={p.icon} size={18} color={p.color} />
              </View>
              <Text style={styles.perkText}>{p.text}</Text>
            </View>
          ))}
        </View>

        <BubblyButton
          label={isLoggedIn ? t.sellTab.apply : t.sellTab.signUpToSell}
          onPress={() => navigation.navigate(isLoggedIn ? 'BecomeSupplier' : 'SignUp')}
          variant="primary"
          colors={colors}
          style={styles.btnOverride}
        />

        {!isLoggedIn && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('SavedAccountLogin')}
          >
            <Text style={styles.secondaryBtnText}>{t.sellTab.haveAccount}</Text>
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
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
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
    borderRadius: radii.xl,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  perkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text,
    flex: 1,
  },
  btnOverride: { width: '100%' },
  secondaryBtn: { paddingVertical: 8 },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
