import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../context/UserContext';
import { requestVerification } from '../services/marketplaceApi';

const BENEFITS = [
  { icon: 'shield-checkmark-outline', text: 'Green verified badge on your profile' },
  { icon: 'star-outline',             text: 'Products appear in Featured Marketplace' },
  { icon: 'trending-up-outline',      text: 'Higher visibility in search results' },
  { icon: 'people-outline',           text: 'Build trust with shopkeepers faster' },
];

export default function VerificationScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser, user } = useUser();

  const [loading, setLoading] = useState(false);

  const verificationStatus = user?.verification_status || 'none';
  const isPending  = verificationStatus === 'pending';
  const isVerified = verificationStatus === 'verified';

  const handleRequest = () => {
    Alert.alert(
      'Confirm Verification Request',
      'Verification costs Rs 2,000/month. Your request will be reviewed by our team. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Apply', onPress: submitRequest },
      ],
    );
  };

  const submitRequest = async () => {
    setLoading(true);
    try {
      await requestVerification({
        idToken, sessionId, refreshToken,
        onTokenRefreshed: (t) => updateUser({ idToken: t }),
      });
      updateUser({ verification_status: 'pending' });
      Alert.alert(
        'Request Submitted',
        'Your verification request has been submitted. Our team will review it shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supplier Verification</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero badge */}
        <View style={styles.heroBadge}>
          <View style={styles.heroIconRing}>
            <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Get Verified</Text>
          <Text style={styles.heroSub}>
            Become a trusted supplier on NEXUM and grow your business faster.
          </Text>
        </View>

        {/* Pricing card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Verification Fee</Text>
            <View style={styles.pricingBadge}>
              <Text style={styles.pricingAmount}>Rs 2,000</Text>
              <Text style={styles.pricingPer}>/month</Text>
            </View>
          </View>
          <Text style={styles.pricingNote}>
            Billed monthly. Cancel anytime. Our team reviews your business profile before approval.
          </Text>
        </View>

        {/* Benefits */}
        <Text style={styles.sectionLabel}>WHAT YOU GET</Text>
        <View style={styles.benefitsCard}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={[styles.benefitRow, i < BENEFITS.length - 1 && styles.benefitBorder]}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Status / CTA */}
        {isVerified ? (
          <View style={styles.statusBanner}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            <Text style={[styles.statusText, { color: '#10B981' }]}>You are already verified!</Text>
          </View>
        ) : isPending ? (
          <View style={[styles.statusBanner, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
            <Ionicons name="time-outline" size={22} color="#F97316" />
            <Text style={[styles.statusText, { color: '#F97316' }]}>
              Verification request pending review
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.applyBtn, loading && { opacity: 0.6 }]}
            onPress={handleRequest}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                  <Text style={styles.applyBtnText}>Apply for Verification</Text>
                </>
            }
          </TouchableOpacity>
        )}

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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontFamily: fonts.semiBold },

  scroll: { padding: spacing.md, paddingBottom: 40 },

  heroBadge: { alignItems: 'center', paddingVertical: spacing.lg, gap: 10 },
  heroIconRing: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: `${colors.primary}15`,
    borderWidth: 2, borderColor: `${colors.primary}30`,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  heroSub:   { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  pricingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  pricingRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pricingLabel: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  pricingBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 3, backgroundColor: `${colors.primary}15`, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 5 },
  pricingAmount:{ fontSize: 18, fontFamily: fonts.bold, color: colors.primary },
  pricingPer:   { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  pricingNote:  { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 18 },

  sectionLabel: {
    fontSize: 11, fontFamily: fonts.semiBold, color: colors.textSecondary,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 10, marginTop: 4,
  },

  benefitsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  benefitRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.md, paddingVertical: 14 },
  benefitBorder:{ borderBottomWidth: 1, borderBottomColor: colors.border },
  benefitIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  benefitText:  { flex: 1, fontSize: 13, fontFamily: fonts.medium, color: colors.text },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    borderRadius: radii.xl, padding: spacing.md, marginTop: 4,
  },
  statusText: { fontSize: 14, fontFamily: fonts.semiBold, flex: 1 },

  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.primary,
    borderRadius: radii.xl, paddingVertical: 16, marginTop: 4,
    borderBottomWidth: 4, borderBottomColor: '#0a524d',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontFamily: fonts.semiBold },
});
