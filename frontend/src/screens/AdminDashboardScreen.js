import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';
import { getAdminStats, getAdminVerifications } from '../services/adminApi';
import { fonts, spacing, radii } from '../constants/theme';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, bg, iconColor, loading }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIconWrap, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} style={{ marginTop: 8 }} />
      ) : (
        <Text style={[styles.statValue, { color: iconColor }]}>{value ?? '—'}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({ label, value, loading, colors }) {
  return (
    <View style={[styles.activityRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={[styles.activityValue, { color: colors.text }]}>{value ?? '—'}</Text>
      )}
    </View>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionButton({ icon, label, subtitle, onPress, colors, badge }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.actionSub, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      {badge != null && (
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { adminEmail, adminLogout } = useUser();

  const [stats,             setStats]             = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [pendingVerifCount, setPendingVerifCount] = useState(0);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, verifs] = await Promise.all([
        getAdminStats(),
        getAdminVerifications().catch(() => []),
      ]);
      setStats(data);
      setPendingVerifCount(Array.isArray(verifs) ? verifs.length : 0);
    } catch (err) {
      setError(err.message || 'Failed to load stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of admin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await adminLogout();
          navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
        },
      },
    ]);
  };

  const displayEmail = adminEmail ? adminEmail.split('@')[0] : 'Admin';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, {
        paddingTop: insets.top + 10,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
      }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>NEXUM Admin</Text>
            <Text style={styles.headerSub}>Logged in as {displayEmail}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* ── Error banner ───────────────────────────────────────────────── */}
        {error && (
          <TouchableOpacity
            style={[styles.errorBanner, { backgroundColor: colors.error }]}
            onPress={fetchStats}
          >
            <Ionicons name="warning-outline" size={16} color="#fff" />
            <Text style={styles.errorText}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        )}

        {/* ── Platform Overview ──────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="business-outline"
            label="Suppliers"
            value={stats?.total_suppliers}
            bg="#E5F5EA"
            iconColor="#0F766E"
            loading={loading}
          />
          <StatCard
            icon="storefront-outline"
            label="Shopkeepers"
            value={stats?.total_shopkeepers}
            bg="#FFF1E6"
            iconColor="#F97316"
            loading={loading}
          />
          <StatCard
            icon="cube-outline"
            label="Products"
            value={stats?.total_products}
            bg="#EEF2FF"
            iconColor="#6366F1"
            loading={loading}
          />
          <StatCard
            icon="receipt-outline"
            label="Orders"
            value={stats?.total_orders}
            bg="#F0FDF4"
            iconColor="#16A34A"
            loading={loading}
          />
        </View>

        {/* ── New User Activity ──────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>New User Signups</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
          <ActivityRow label="Last 24 hours"  value={stats?.new_users_24h} loading={loading} colors={colors} />
          <ActivityRow label="Last 7 days"    value={stats?.new_users_7d}  loading={loading} colors={colors} />
          <ActivityRow label="Last 30 days"   value={stats?.new_users_30d} loading={loading} colors={colors} />
        </View>

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage</Text>
        <View style={styles.actionsList}>
          <ActionButton
            icon="people-outline"
            label="View Suppliers"
            subtitle={`${stats?.total_suppliers ?? '...'} registered suppliers`}
            onPress={() => navigation.navigate('AdminSuppliers')}
            colors={colors}
          />
          <ActionButton
            icon="storefront-outline"
            label="View Shopkeepers"
            subtitle={`${stats?.total_shopkeepers ?? '...'} registered shopkeepers`}
            onPress={() => navigation.navigate('AdminShopkeepers')}
            colors={colors}
          />
          <ActionButton
            icon="cube-outline"
            label="View Products"
            subtitle={`${stats?.total_products ?? '...'} active listings`}
            onPress={() => navigation.navigate('AdminProducts')}
            colors={colors}
          />
          <ActionButton
            icon="shield-checkmark-outline"
            label="Pending Verifications"
            subtitle={loading ? 'Loading...' : `${pendingVerifCount} request${pendingVerifCount !== 1 ? 's' : ''} awaiting review`}
            badge={pendingVerifCount > 0 ? pendingVerifCount : null}
            onPress={() => navigation.navigate('AdminVerifications')}
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 4,
  },
  headerRow:  { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontFamily: fonts.bold },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  logoutBtn:   { padding: 8, marginLeft: 8 },

  // ── Error banner ──────────────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: spacing.md, borderRadius: radii.md,
    padding: 12,
  },
  errorText: { color: '#fff', fontFamily: fonts.medium, fontSize: 13, flex: 1 },

  // ── Section title ─────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // ── Stats grid ────────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: radii.xl,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 26, fontFamily: fonts.bold, marginTop: 10 },
  statLabel: { fontSize: 12, fontFamily: fonts.medium, color: '#6B7280', marginTop: 4 },

  // ── Activity card ─────────────────────────────────────────────────────────
  activityCard: {
    marginHorizontal: spacing.md,
    borderRadius: radii.xl,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  activityLabel: { fontSize: 14, fontFamily: fonts.medium },
  activityValue: { fontSize: 18, fontFamily: fonts.bold },

  // ── Actions list ──────────────────────────────────────────────────────────
  actionsList: { paddingHorizontal: spacing.md, gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radii.xl,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 15, fontFamily: fonts.semiBold },
  actionSub:   { fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  badgePill: {
    backgroundColor: '#EF4444', borderRadius: 12,
    minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: fonts.bold },
});
