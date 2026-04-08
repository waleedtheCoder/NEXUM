// frontend/src/screens/MoreMenuScreen.js
//
// The "More" settings screen accessible from AccountSettings top-right gear icon.
// Contains the theme toggle switch.
// Updated to use useTheme() for full dark mode support.

import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { fonts, spacing, radii, shadows } from '../constants/theme';

const getFeatureCards = (t) => [
  { icon: 'business',      titleKey: 'businessProfile', screen: 'EditProfile'      },
  { icon: 'storefront',    titleKey: 'savedSuppliers',  screen: 'MarketplaceBrowsing' },
  { icon: 'cube',          titleKey: 'savedProducts',   screen: 'SavedListings'    },
  { icon: 'receipt',       titleKey: 'purchaseHistory', screen: 'OrderHistory'     },
  { icon: 'notifications', titleKey: 'restockReminders',screen: 'RestockReminders' },
  { icon: 'card',          titleKey: 'creditsLimits',   screen: null               },
];

export default function MoreMenuScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, isUrdu, toggleLanguage } = useLanguage();

  const styles = makeStyles(colors);

  const handleFeatureCard = (card) => {
    if (card.screen) {
      navigation.navigate(card.screen);
    } else {
      Alert.alert(t.moreMenu[card.titleKey], t.common.comingSoon);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={t.moreMenu.title} showBack />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Feature grid */}
        <View style={styles.grid}>
          {getFeatureCards(t).map((card, i) => (
            <TouchableOpacity
              key={i}
              style={styles.featureCard}
              onPress={() => handleFeatureCard(card)}
            >
              <Ionicons name={`${card.icon}-outline`} size={26} color={colors.primary} />
              <Text style={styles.featureCardText}>{t.moreMenu[card.titleKey]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Promo card */}
        <View style={styles.promoCard}>
          <Text style={styles.promoText}>{t.moreMenu.promoText}</Text>
          <TouchableOpacity
            style={styles.promoBtn}
            onPress={() => navigation.navigate('MarketplaceBrowsing')}
          >
            <Text style={styles.promoBtnText}>{t.moreMenu.findSuppliers}</Text>
          </TouchableOpacity>
        </View>

        {/* Settings list */}
        <View style={styles.settingsList}>

          {/* ── Dark Mode Toggle ── */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny-outline'}
                size={20}
                color={colors.primary}
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingLabel}>
                  {isDark ? t.moreMenu.darkMode : t.moreMenu.lightMode}
                </Text>
                <Text style={styles.settingDesc}>
                  {isDark ? t.moreMenu.darkDesc : t.moreMenu.lightDesc}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: `${colors.primary}80` }}
              thumbColor={isDark ? colors.primary : colors.surface}
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={styles.settingDivider} />

          {/* ── Language Toggle ── */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="globe-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <View>
                <Text style={styles.settingLabel}>{t.moreMenu.language}</Text>
                <Text style={styles.settingDesc}>{isUrdu ? t.accountSettings.urdu : t.accountSettings.english}</Text>
              </View>
            </View>
            <Switch
              value={isUrdu}
              onValueChange={toggleLanguage}
              trackColor={{ false: colors.border, true: `${colors.primary}80` }}
              thumbColor={isUrdu ? colors.primary : colors.surface}
              ios_backgroundColor={colors.border}
            />
          </View>

          <View style={styles.settingDivider} />

          {/* ── Customer Support ── */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert(t.moreMenu.customerSupport, 'support@nexum.pk')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="headset-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{t.moreMenu.customerSupport}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          {/* ── Invite ── */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert(t.moreMenu.invite, t.common.comingSoon)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="person-add-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>{t.moreMenu.invite}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

        </View>

        {/* App version */}
        <Text style={styles.version}>{t.moreMenu.version}</Text>

      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll:    { padding: spacing.md, paddingBottom: 40 },

  // Feature grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
  },
  featureCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  featureCardText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: 'center',
  },

  // Promo card
  promoCard: {
    backgroundColor: `${colors.primary}12`,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  promoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text,
    lineHeight: 18,
  },
  promoBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  promoBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },

  // Settings list
  settingsList: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingIcon: {
    width: 22,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  settingDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 1,
  },
  settingValue: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // App version
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: 8,
  },

});