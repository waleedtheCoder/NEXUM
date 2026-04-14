/**
 * AdminUserDetailScreen.js
 *
 * Shows a detailed profile card for a supplier or shopkeeper.
 * For suppliers  → reuses the existing getSupplierProfile API + lists their listings.
 * For shopkeepers → displays the data passed via route params (no separate API needed).
 *
 * Route params: { userId, userName, role: 'SUPPLIER' | 'SHOPKEEPER', userData? }
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../hooks/useTheme';
import { getSupplierProfile } from '../services/marketplaceApi';
import { fonts, spacing, radii } from '../constants/theme';

function InfoRow({ icon, label, value, colors }) {
  if (!value) return null;
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.infoIconWrap, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function AdminUserDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();

  const { userId, userName, role, userData } = route.params || {};
  const isSupplier = role === 'SUPPLIER';

  const [supplier, setSupplier] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(isSupplier);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!isSupplier) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getSupplierProfile(userId);
        if (!cancelled) {
          setSupplier(data);
          setListings(Array.isArray(data.listings) ? data.listings : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, isSupplier]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title={userName || 'Profile'} showBack />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title={userName || 'Profile'} showBack />
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={40} color={colors.error} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      </View>
    );
  }

  // Resolve data — supplier API or shopkeeper passthrough
  const displayName  = isSupplier ? (supplier?.name || userName) : (userData?.name || userName);
  const displayEmail = isSupplier ? supplier?.email : userData?.email;
  const displayPhone = isSupplier ? supplier?.phone : userData?.phone;
  const joinedDate   = isSupplier ? supplier?.joinedDate : userData?.joined_date;
  const initials     = (displayName || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const iconColor    = isSupplier ? colors.primary : colors.accent;

  const renderListing = ({ item }) => (
    <TouchableOpacity
      style={[styles.listingCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
      activeOpacity={0.82}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.listingImg} resizeMode="cover" />
      ) : (
        <View style={[styles.listingImg, styles.listingImgPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
          <Ionicons name="cube-outline" size={18} color={colors.textLight} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.listingPrice, { color: colors.accent }]}>Rs {item.price}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
    </TouchableOpacity>
  );

  const Header = (
    <View>
      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: `${iconColor}18` }]}>
          <Text style={[styles.avatarText, { color: iconColor }]}>{initials}</Text>
        </View>
        <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
        <View style={[styles.rolePill, { backgroundColor: `${iconColor}15` }]}>
          <Text style={[styles.roleText, { color: iconColor }]}>
            {isSupplier ? 'Supplier' : 'Shopkeeper'}
          </Text>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          {isSupplier && (
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.text }]}>{listings.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Listings</Text>
            </View>
          )}
          {!isSupplier && (
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.text }]}>{userData?.total_orders ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
            </View>
          )}
          {joinedDate && (
            <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <Text style={[styles.statNum, { color: colors.text }]}>{joinedDate}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Member Since</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info rows */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <InfoRow icon="mail-outline"      label="Email"        value={displayEmail} colors={colors} />
        <InfoRow icon="call-outline"      label="Phone"        value={displayPhone} colors={colors} />
        <InfoRow icon="calendar-outline"  label="Joined"       value={joinedDate}   colors={colors} />
      </View>

      {/* Listings heading — suppliers only */}
      {isSupplier && listings.length > 0 && (
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Listings</Text>
      )}
    </View>
  );

  if (!isSupplier) {
    // Shopkeepers: no listings — just show profile card + info
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title={displayName || 'Profile'} showBack />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          {Header}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={displayName || 'Supplier'} showBack />
      <FlatList
        data={listings}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderListing}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="cube-outline" size={36} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active listings.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { alignItems: 'center', paddingTop: 40, gap: 10 },

  profileCard: {
    margin: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 6,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText:  { fontSize: 28, fontFamily: fonts.bold },
  displayName: { fontSize: 18, fontFamily: fonts.bold, marginBottom: 8 },
  rolePill: {
    borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16,
  },
  roleText: { fontSize: 12, fontFamily: fonts.semiBold },
  statsRow: {
    flexDirection: 'row', width: '100%',
    borderTopWidth: 1, paddingTop: 14,
  },
  statItem:  { flex: 1, alignItems: 'center' },
  statNum:   { fontSize: 18, fontFamily: fonts.bold },
  statLabel: { fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },

  infoCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.xl,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, fontFamily: fonts.regular, marginBottom: 2 },
  infoValue: { fontSize: 14, fontFamily: fonts.medium },

  sectionTitle: {
    fontSize: 15, fontFamily: fonts.bold,
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },

  listingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing.md, marginBottom: 8,
    borderRadius: radii.lg, padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  listingImg:            { width: 50, height: 50, borderRadius: radii.sm },
  listingImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  listingTitle: { fontSize: 13, fontFamily: fonts.medium, marginBottom: 3 },
  listingPrice: { fontSize: 13, fontFamily: fonts.bold },

  emptyText: { fontSize: 13, fontFamily: fonts.regular },
});
