/**
 * SupplierNetworkScreen.js
 *
 * Shopkeeper's saved supplier network.
 * Shows all favourited suppliers. Tap a card to view their profile.
 * Tap the heart icon to remove from network.
 * Route: 'SupplierNetwork'
 * API:
 *   GET  /api/users/network/              → list of saved suppliers
 *   POST /api/users/network/toggle/       → add / remove a supplier
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../context/UserContext';
import { getSupplierNetwork, toggleFavouriteSupplier } from '../services/marketplaceApi';

function SupplierCard({ supplier, onRemove, removing, onPress, colors, styles }) {
  const initials = supplier.initials
    || (supplier.name || 'S').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.avatar, { backgroundColor: supplier.avatarColor || colors.primaryLight }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{supplier.name}</Text>
        <Text style={styles.cardMeta}>
          {supplier.totalListings ?? 0} active listing{supplier.totalListings !== 1 ? 's' : ''}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.removeBtn}
        onPress={onRemove}
        disabled={removing}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {removing
          ? <ActivityIndicator size="small" color={colors.accent} />
          : <Ionicons name="heart" size={20} color={colors.accent} />
        }
      </TouchableOpacity>

      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function SupplierNetworkScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  const fetchNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSupplierNetwork(authArgs);
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load supplier network.');
    } finally {
      setLoading(false);
    }
  }, [idToken, sessionId]);

  useFocusEffect(
    useCallback(() => {
      fetchNetwork();
    }, [fetchNetwork])
  );

  const handleRemove = async (supplierId) => {
    setRemovingId(supplierId);
    try {
      await toggleFavouriteSupplier(supplierId, authArgs);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    } catch {
      // silently ignore — item stays in list
    } finally {
      setRemovingId(null);
    }
  };

  const renderItem = ({ item }) => (
    <SupplierCard
      supplier={item}
      onPress={() => navigation.navigate('SupplierProfile', { supplierId: item.id })}
      onRemove={() => handleRemove(item.id)}
      removing={removingId === item.id}
      colors={colors}
      styles={styles}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="people-outline" size={56} color={colors.textLight} />
      <Text style={styles.emptyTitle}>No suppliers saved yet</Text>
      <Text style={styles.emptySub}>
        Browse the marketplace, find suppliers you trust, and save them here for quick access.
      </Text>
      <TouchableOpacity
        style={styles.browseBtn}
        onPress={() => navigation.navigate('MarketplaceBrowsing')}
      >
        <Text style={styles.browseBtnText}>Browse Marketplace</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supplier Network</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.accent} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNetwork}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={suppliers.length === 0 ? styles.flatListEmpty : styles.flatList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            suppliers.length > 0 ? (
              <Text style={styles.countLabel}>
                {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} in your network
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.lg },

  flatList:      { padding: spacing.md },
  flatListEmpty: { flex: 1, padding: spacing.md },
  separator:     { height: 10 },

  countLabel: {
    fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 12,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: 12,
    ...shadows.sm,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: fonts.bold, color: '#fff' },
  cardInfo:   { flex: 1 },
  cardName:   { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 2 },
  cardMeta:   { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  removeBtn:  { padding: 4 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  emptySub:   { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  browseBtn: {
    marginTop: 8, backgroundColor: colors.primary,
    borderRadius: radii.xl, paddingHorizontal: 24, paddingVertical: 12,
  },
  browseBtnText: { color: '#fff', fontFamily: fonts.semiBold, fontSize: 14 },

  errorText: { fontSize: 14, fontFamily: fonts.medium, color: colors.accent, textAlign: 'center' },
  retryBtn:  { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.xl },
  retryText: { color: '#fff', fontFamily: fonts.semiBold, fontSize: 14 },
});
