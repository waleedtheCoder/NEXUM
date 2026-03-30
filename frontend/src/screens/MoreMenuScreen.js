// frontend/src/screens/MoreMenuScreen.js
//
// The "More" settings screen accessible from AccountSettings top-right gear icon.
// Contains the theme toggle switch.
// Updated to use useTheme() for full dark mode support.

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Modal, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../hooks/useTheme';
import { fonts, spacing, radii, shadows } from '../constants/theme';

const FEATURE_CARDS = [
  { icon: 'business',      title: 'Business Profile Settings', screen: 'EditProfile'     },
  { icon: 'storefront',    title: 'Saved Suppliers',           screen: 'MarketplaceBrowsing' },
  { icon: 'cube',          title: 'Saved Products',            screen: 'SavedListings'   },
  { icon: 'receipt',       title: 'Purchase History',          screen: 'OrderHistory'    },
  { icon: 'notifications', title: 'Restock Reminders',         screen: 'RestockReminders'},
  { icon: 'card',          title: 'Credits & Limits',          screen: null              },
];

const LANGUAGES = [
  { key: 'english', label: 'English' },
  { key: 'urdu',    label: 'اردو (Urdu)' },
];

export default function MoreMenuScreen() {
  
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();

  const [langModalOpen, setLangModalOpen] = useState(false);
  const [selectedLang, setSelectedLang]   = useState('english');

  const styles = makeStyles(colors);

  const handleFeatureCard = (card) => {
    if (card.screen) {
      navigation.navigate(card.screen);
    } else {
      Alert.alert(card.title, 'This feature is coming soon!');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title="NEXUM" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Feature grid */}
        <View style={styles.grid}>
          {FEATURE_CARDS.map((card, i) => (
            <TouchableOpacity
              key={i}
              style={styles.featureCard}
              onPress={() => handleFeatureCard(card)}
            >
              <Ionicons name={`${card.icon}-outline`} size={26} color={colors.primary} />
              <Text style={styles.featureCardText}>{card.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Promo card */}
        <View style={styles.promoCard}>
          <Text style={styles.promoText}>Looking to expand your supplier network?</Text>
          <TouchableOpacity
            style={styles.promoBtn}
            onPress={() => navigation.navigate('MarketplaceBrowsing')}
          >
            <Text style={styles.promoBtnText}>Find Suppliers</Text>
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
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={styles.settingDesc}>
                  {isDark ? 'Black / Rust Orange' : 'White / Teal Green'}
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

          {/* ── Language ── */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setLangModalOpen(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="globe-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {selectedLang === 'english' ? 'English' : 'اردو'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </View>
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          {/* ── Customer Support ── */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert('Support', 'Email us at support@nexum.pk')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="headset-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Customer Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          {/* ── Invite ── */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert('Invite', 'Share your referral link with other retailers!')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="person-add-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Invite Retailers to NEXUM</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

        </View>

        {/* App version */}
        <Text style={styles.version}>NEXUM v1.0.0</Text>

      </ScrollView>

      {/* Language modal */}
      <Modal
        visible={langModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Language</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.langOption,
                  selectedLang === lang.key && styles.langOptionActive,
                ]}
                onPress={() => {
                  setSelectedLang(lang.key);
                  setLangModalOpen(false);
                }}
              >
                <Text style={[
                  styles.langOptionText,
                  selectedLang === lang.key && styles.langOptionTextActive,
                ]}>
                  {lang.label}
                </Text>
                {selectedLang === lang.key && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setLangModalOpen(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // Language modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 36,
    gap: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
  },
  langOptionActive: {
    backgroundColor: `${colors.primary}12`,
  },
  langOptionText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  langOptionTextActive: {
    color: colors.primary,
  },
  modalClose: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCloseText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
});