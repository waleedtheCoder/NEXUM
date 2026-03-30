/**
 * BecomeSupplierScreen.js
 *
 * Shown when a shopkeeper taps "Register as Supplier".
 * Explains the benefits and starts the supplier registration flow.
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const BENEFITS = [
  {
    icon: 'storefront-outline',
    title: 'List Your Products',
    desc: 'Create product listings visible to thousands of shopkeepers across Pakistan.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Grow Your Sales',
    desc: 'Receive bulk orders directly from verified retailers on the platform.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Get Verified',
    desc: 'Earn a Verified Supplier badge to build trust with buyers.',
  },
  {
    icon: 'chatbubble-outline',
    title: 'Direct Communication',
    desc: 'Chat directly with shopkeepers to close deals faster.',
  },
  {
    icon: 'card-outline',
    title: 'Easy Payouts',
    desc: 'Manage your earnings and receive payments securely.',
  },
];

export default function BecomeSupplierScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleApply = () => {
    Alert.alert(
      'Supplier Registration',
      'Supplier registration is coming soon! Our team will reach out to verified businesses. Please check back later.',
      [{ text: 'OK' }],
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Supplier</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="storefront" size={40} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Start Selling on NEXUM</Text>
          <Text style={styles.heroSub}>
            Join hundreds of suppliers already reaching shopkeepers across Pakistan.
          </Text>
        </View>

        {/* Benefits */}
        <Text style={styles.sectionLabel}>Why Sell on NEXUM?</Text>
        <View style={styles.benefitsList}>
          {BENEFITS.map((b, i) => (
            <View
              key={i}
              style={[styles.benefitItem, i < BENEFITS.length - 1 && styles.benefitItemBorder]}
            >
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Requirements */}
        <Text style={styles.sectionLabel}>Requirements</Text>
        <View style={styles.requirementsCard}>
          {[
            'Valid business registration (SECP / NTN)',
            'Active phone number for verification',
            'Product photos and descriptions ready',
            'Ability to fulfil bulk orders',
          ].map((req, i) => (
            <View key={i} style={styles.reqRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.reqText}>{req}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
          <Ionicons name="storefront-outline" size={20} color="#fff" />
          <Text style={styles.applyBtnText}>Apply to Become a Supplier</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Our team reviews applications within 2–3 business days.
          Approved suppliers are immediately listed on the platform.
        </Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
  },
  backBtn:     { padding: 4, width: 36 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontFamily: fonts.semiBold },

  scroll: { padding: spacing.md },

  hero: {
    alignItems: 'center', paddingVertical: spacing.xl, gap: 12, marginBottom: spacing.md,
  },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' },
  heroSub:   { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.md },

  sectionLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  benefitsList: {
    backgroundColor: colors.surface, borderRadius: radii.xl, marginBottom: spacing.md, ...shadows.sm, overflow: 'hidden',
  },
  benefitItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  benefitItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  benefitIcon: {
    width: 38, height: 38, borderRadius: radii.md,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  benefitText:  { flex: 1 },
  benefitTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 2 },
  benefitDesc:  { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 18 },

  requirementsCard: {
    backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md,
    marginBottom: spacing.md, gap: 10, ...shadows.sm,
  },
  reqRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reqText: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: colors.text, lineHeight: 20 },

  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: colors.primary, borderRadius: radii.xl,
    paddingVertical: 16, marginBottom: spacing.md,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontFamily: fonts.semiBold },

  footerNote: {
    fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 18,
  },
});
