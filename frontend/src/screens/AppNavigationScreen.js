import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';

const FEATURE_CARDS = [
  { icon: 'business',      title: 'Business Profile Settings', screen: 'EditProfile'         },
  { icon: 'storefront',    title: 'Saved Suppliers',           screen: 'MarketplaceBrowsing' },
  // FIX: was 'MarketplaceBrowsing' — SavedListings is the correct destination
  { icon: 'cube',          title: 'Saved Products',            screen: 'SavedListings'       },
  // FIX: was null (coming soon) — OrderHistory is fully built and registered
  { icon: 'receipt',       title: 'Purchase History',          screen: 'OrderHistory'        },
  { icon: 'notifications', title: 'Restock Reminders',         screen: 'RestockReminders'                  },
  { icon: 'card',          title: 'Credits & Limits',          screen: null                  },
];

const LANGUAGES = [
  { key: 'english', label: 'English' },
  { key: 'urdu',    label: 'اردو (Urdu)' },
];

export default function AppNavigationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [langModalOpen, setLangModalOpen]   = useState(false);
  const [selectedLang, setSelectedLang]     = useState('english');

  const handleFeatureCard = (card) => {
    if (card.screen) {
      navigation.navigate(card.screen);
    } else {
      Alert.alert(card.title, 'This feature is coming soon!');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
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
          {[
            {
              icon: 'globe-outline',
              label: 'Language',
              onPress: () => setLangModalOpen(true),
            },
            {
              icon: 'headset-outline',
              label: 'Customer Support',
              onPress: () => Alert.alert('Support', 'Email us at support@nexum.pk'),
            },
            {
              icon: 'person-add-outline',
              label: 'Invite Retailers to NEXUM',
              onPress: () => Alert.alert('Invite', 'Share your referral link with other retailers!'),
            },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={i}
              style={[styles.settingsItem, i < arr.length - 1 && styles.settingsItemBorder]}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={20} color={colors.primary} />
              <Text style={styles.settingsItemText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Language picker modal */}
      <Modal
        visible={langModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLangModalOpen(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <TouchableOpacity onPress={() => setLangModalOpen(false)}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.key}
              style={styles.langOption}
              onPress={() => {
                setSelectedLang(lang.key);
                setLangModalOpen(false);
              }}
            >
              <Text style={styles.langOptionText}>{lang.label}</Text>
              <Ionicons
                name={selectedLang === lang.key ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedLang === lang.key ? colors.green : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll:    { padding: spacing.md, paddingBottom: 32 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.md },
  featureCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: radii.xl,
    padding: 16, alignItems: 'center', gap: 10, ...shadows.sm,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.12)',
  },
  featureCardText: {
    fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 17,
  },

  promoCard: {
    backgroundColor: colors.surface, borderRadius: radii.xl, borderWidth: 2,
    borderColor: colors.accent, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm,
  },
  promoText:    { fontSize: 14, fontFamily: fonts.regular, color: colors.text, marginBottom: 12 },
  promoBtn:     { backgroundColor: colors.accent, borderRadius: radii.md, paddingVertical: 11, alignItems: 'center' },
  promoBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },

  settingsList:       { backgroundColor: colors.surface, borderRadius: radii.xl, overflow: 'hidden', ...shadows.sm },
  settingsItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingVertical: 15 },
  settingsItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsItemText:   { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.text },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle:     { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  langOption:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  langOptionText: { fontSize: 15, fontFamily: fonts.regular, color: colors.text },
});