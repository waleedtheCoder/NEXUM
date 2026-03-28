/**
 * SavedListingsScreen.js
 *
 * Shows all listings the logged-in shopkeeper has saved (hearted).
 * Route name: SavedListings
 * Accessible from: AccountSettingsScreen → Saved Listings menu item
 * API: GET /api/listings/saved/
 *
 * Features:
 *   - Same 2-column grid layout as MarketplaceBrowsingScreen
 *   - Heart button on each card calls toggleSaveListing() to unsave
 *   - Optimistic removal — card disappears instantly, reverts on error
 *   - Pull-to-refresh
 *   - Empty state with browse CTA
 *   - Auth-gated — redirects to AccountLoggedOut if not logged in
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getSavedListings, toggleSaveListing } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

export default function SavedListingsScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, isLoggedIn, updateUser } = useUser();

  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);
  // Track which IDs are currently being unsaved so we can disable their button
  const [unsavingIds, setUnsavingIds] = useState(new Set());

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── Auth gate ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      navigation.replace('AccountLoggedOut');
    }
  }, [isLoggedIn]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSaved = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getSavedListings(authArgs);
      setListings(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message || 'Failed to load saved listings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) fetchSaved();
    }, [idToken, sessionId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSaved({ silent: true });
  };

  // ── Unsave (optimistic) ───────────────────────────────────────────────────
  const handleUnsave = async (item) => {
    if (unsavingIds.has(item.id)) return;

    // Optimistically remove from list
    setListings((prev) => prev.filter((l) => l.id !== item.id));
    setUnsavingIds((prev) => new Set(prev).add(item.id));

    try {
      await toggleSaveListing(item.id, false, authArgs);
    } catch {
      // Revert on failure
      setListings((prev) => {
        // Only add back if not already present
        if (prev.find((l) => l.id === item.id)) return prev;
        return [item, ...prev];
      });
    } finally {
      setUnsavingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  // ── Render card ───────────────────────────────────────────────────────────
  const renderCard = ({ item }) => {
    const isBusy = unsavingIds.has(item.id);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        activeOpacity={0.85}
      >
        {/* Image */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="image-outline" size={28} color={colors.textLight} />
          </View>
        )}

        {/* Featured badge */}
        {item.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}

        {/* Unsave (heart) button */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => handleUnsave(item)}
          disabled={isBusy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isBusy
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <Ionicons name="heart" size={18} color={colors.accent} />
          }
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={styles.cardPrice}>Rs {item.price}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
            <Text style={styles.cardMetaText} numberOfLines={1}>{item.location}</Text>
          </View>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Listings</Text>
        {listings.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{listings.length}</Text>
          </View>
        )}
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSaved()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {!loading && !error && (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={56} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No saved listings yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart on any product to save it here for later.
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.navigate('MarketplaceBrowsing')}
              >
                <Text style={styles.browseBtnText}>Browse Marketplace</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderCard}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.md },

  // Header
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: fonts.semiBold, color: '#fff' },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: { color: '#fff', fontSize: 13, fontFamily: fonts.semiBold },

  // Grid
  listContent: { padding: spacing.md, paddingBottom: 32 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },

  // Card
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardImage: { width: '100%', height: 120 },
  cardImagePlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  featuredText: { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },
  heartBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { padding: 8 },
  cardPrice: { fontSize: 13, fontFamily: fonts.bold, color: colors.accent, marginBottom: 2 },
  cardTitle: { fontSize: 11, fontFamily: fonts.medium, color: colors.text, marginBottom: 4, lineHeight: 15 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMetaText: { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary, flex: 1 },
  cardTime: { fontSize: 10, fontFamily: fonts.regular, color: colors.textLight, marginTop: 2 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  emptySubtitle: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  browseBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  browseBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },

  // Error
  errorText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radii.lg, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontFamily: fonts.medium, fontSize: 14 },
});