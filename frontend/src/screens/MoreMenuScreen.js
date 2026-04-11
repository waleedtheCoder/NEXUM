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
import PressableBounce from '../components/PressableBounce';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { fonts, spacing, radii } from '../constants/theme';

const FEATURE_META = [
  { icon: 'business',      iconBg: '#E6F4FF', iconColor: '#0F766E', titleKey: 'businessProfile', screen: 'EditProfile'       },
  { icon: 'storefront',    iconBg: '#E6F4FF', iconColor: '#0F766E', titleKey: 'savedSuppliers',  screen: 'MarketplaceBrowsing' },
  { icon: 'cube',          iconBg: '#F3E8FF', iconColor: '#9333EA', titleKey: 'savedProducts',   screen: 'SavedListings'     },
  { icon: 'receipt',       iconBg: '#FFF1E6', iconColor: '#F97316', titleKey: 'purchaseHistory', screen: 'OrderHistory'      },
  { icon: 'notifications', iconBg: '#F3E8FF', iconColor: '#9333EA', titleKey: 'restockReminders',screen: 'RestockReminders'  },
  { icon: 'card',          iconBg: '#F0FDF4', iconColor: '#22C55E', titleKey: 'creditsLimits',   screen: null                },
];

export default function MoreMenuScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, isUrdu, toggleLanguage } = useLanguage();
  const styles = makeStyles(colors);

  const handleFeatureCard = (card) => {
    if (card.screen) navigation.navigate(card.screen);
    else Alert.alert(t.moreMenu[card.titleKey], t.common.comingSoon);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={t.moreMenu.title} showBack />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Feature grid */}
        <View style={styles.grid}>
          {FEATURE_META.map((card, i) => (
            <PressableBounce
              key={i}
              style={styles.featureCard}
              onPress={() => handleFeatureCard(card)}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: card.iconBg }]}>
                <Ionicons name={`${card.icon}-outline`} size={22} color={card.iconColor} />
              </View>
              <Text style={styles.featureCardText}>{t.moreMenu[card.titleKey]}</Text>
            </PressableBounce>
          ))}
        </View>

        {/* Promo card */}
        <PressableBounce
          style={styles.promoCard}
          onPress={() => navigation.navigate('MarketplaceBrowsing')}
        >
          <View style={styles.promoCircle} />
          <View style={styles.promoContent}>
            <Text style={styles.promoText}>{t.moreMenu.promoText}</Text>
            <View style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>{t.moreMenu.findSuppliers}</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </View>
        </PressableBounce>

        {/* Settings list */}
        <View style={styles.settingsList}>

          {/* ── Dark Mode Toggle ── */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: '#E6F4FF' }]}>
                <Ionicons
                  name={isDark ? 'moon' : 'sunny-outline'}
                  size={18}
                  color={colors.primary}
                />
              </View>
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
              <View style={[styles.settingIconWrap, { backgroundColor: '#E6F4FF' }]}>
                <Ionicons name="globe-outline" size={18} color={colors.primary} />
              </View>
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
          <PressableBounce
            style={styles.settingRow}
            onPress={() => Alert.alert(t.moreMenu.customerSupport, 'support@nexum.pk')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: '#FFF1E6' }]}>
                <Ionicons name="headset-outline" size={18} color="#F97316" />
              </View>
              <Text style={styles.settingLabel}>{t.moreMenu.customerSupport}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </PressableBounce>

          <View style={styles.settingDivider} />

          {/* ── Invite ── */}
          <PressableBounce
            style={styles.settingRow}
            onPress={() => Alert.alert(t.moreMenu.invite, t.common.comingSoon)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="person-add-outline" size={18} color="#22C55E" />
              </View>
              <Text style={styles.settingLabel}>{t.moreMenu.invite}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </PressableBounce>

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
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCardText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: 'center',
  },

  // Promo card
  promoCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  promoCircle: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  promoContent: { flex: 1, gap: 10 },
  promoText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#fff',
    lineHeight: 19,
  },
  promoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
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
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
