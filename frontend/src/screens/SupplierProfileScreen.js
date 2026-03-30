/**
 * SupplierProfileScreen.js
 *
 * Public supplier profile page.
 * Routable from: ProductDetailScreen → seller card tap
 * Route params: { supplierId: number }
 * API: GET /api/users/supplier/<id>/
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../context/UserContext';
import { getSupplierProfile } from '../services/marketplaceApi';

// Props-based — avoids referencing out-of-scope colors/styles
function StarRating({ rating = 0, accentColor }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array(full).fill(null).map((_, i) => (
        <Ionicons key={`f${i}`} name="star" size={14} color={accentColor} />
      ))}
      {half && <Ionicons name="star-half" size={14} color={accentColor} />}
      {Array(empty).fill(null).map((_, i) => (
        <Ionicons key={`e${i}`} name="star-outline" size={14} color={accentColor} />
      ))}
    </View>
  );
}

function ListingCard({ item, onPress, colors, styles }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Ionicons name="image-outline" size={28} color={colors.textLight} />
        </View>
      )}
      {item.isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardPrice}>Rs {item.price}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
          <Text style={styles.cardMetaText} numberOfLines={1}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SupplierProfileScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const { supplierId } = route.params || {};

  const [supplier, setSupplier] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  useEffect(() => {
    if (!supplierId) {
      setError('No supplier ID provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getSupplierProfile(supplierId, authArgs);
        if (!cancelled) {
          setSupplier(data);
          setListings(Array.isArray(data.listings) ? data.listings : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load supplier profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supplierId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !supplier) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Ionicons name="person-circle-outline" size={56} color={colors.textLight} />
        <Text style={styles.errorText}>{error || 'Supplier not found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = supplier.initials
    || (supplier.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    || 'S';

  const ListHeader = (
    <View>
      <View style={[styles.headerBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supplier Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.supplierName}>{supplier.name}</Text>

        <View style={styles.ratingRow}>
          <StarRating rating={Number(supplier.rating) || 0} accentColor={colors.accent} />
          <Text style={styles.ratingValue}>{Number(supplier.rating || 0).toFixed(1)}</Text>
          {supplier.totalReviews != null && (
            <Text style={styles.ratingCount}>({supplier.totalReviews} reviews)</Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{supplier.totalListings ?? listings.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          {supplier.joinedDate && (
            <View style={[styles.statItem, styles.statItemBorder]}>
              <Text style={styles.statNum}>{supplier.joinedDate}</Text>
              <Text style={styles.statLabel}>Member since</Text>
            </View>
          )}
          {supplier.totalSales != null && (
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{supplier.totalSales}</Text>
              <Text style={styles.statLabel}>Sales</Text>
            </View>
          )}
        </View>

        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
          <Text style={styles.verifiedText}>Verified Supplier</Text>
        </View>
      </View>

      {listings.length > 0 && (
        <Text style={styles.listingsHeading}>Active Listings</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <FlatList
        data={listings}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No active listings from this supplier.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ListingCard
            item={item}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
            colors={colors}
            styles={styles}
          />
        )}
      />
    </View>
  );
}

const CARD_WIDTH = '48%';

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },

  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: 16,
    backgroundColor: colors.primary,
  },
  backBtn: { padding: 4 },
  backBtnAbsolute: { position: 'absolute', top: 60, left: 16 },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#fff' },

  profileCard: {
    backgroundColor: colors.surface, margin: spacing.md,
    borderRadius: radii.xl, padding: spacing.md, alignItems: 'center',
    ...shadows.sm,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontFamily: fonts.bold, color: colors.primary },
  supplierName: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginBottom: 8 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  ratingValue: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  ratingCount: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },

  statsRow: { flexDirection: 'row', width: '100%', marginBottom: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statItemBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  statNum: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  statLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },

  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${colors.primary}12`, borderRadius: radii.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  verifiedText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },

  listingsHeading: {
    fontSize: 16, fontFamily: fonts.bold, color: colors.text,
    paddingHorizontal: spacing.md, marginBottom: 8,
  },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: 24 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },

  card: {
    width: CARD_WIDTH, backgroundColor: colors.surface,
    borderRadius: radii.xl, overflow: 'hidden', ...shadows.sm,
  },
  cardImage: { width: '100%', height: 110 },
  cardImagePlaceholder: { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  featuredBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: colors.accent, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  featuredText: { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },
  cardBody: { padding: 8 },
  cardPrice: { fontSize: 13, fontFamily: fonts.bold, color: colors.accent, marginBottom: 2 },
  cardTitle: { fontSize: 11, fontFamily: fonts.medium, color: colors.text, marginBottom: 4, lineHeight: 15 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMetaText: { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary, flex: 1 },

  emptyState: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  errorText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radii.lg, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
  retryText: { color: '#fff', fontFamily: fonts.medium, fontSize: 14 },
});
