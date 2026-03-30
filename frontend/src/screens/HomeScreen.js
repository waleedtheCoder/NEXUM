import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, StatusBar, FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import HomeTopBar from '../components/HomeTopBar';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getListings, getCategories, getPromotions } from '../services/marketplaceApi';

// ── Static / navigation-only data (no API equivalent) ────────────────────────
const QUICK_CATEGORIES = [
  { icon: 'pricetag', label: 'Offers' },
  { icon: 'people', label: 'New Suppliers' },
  { icon: 'trending-up', label: 'Restock Deals' },
  { icon: 'cube', label: 'Bulk Essentials' },
  { icon: 'location', label: 'Local Favorites' },
];

// No static fallbacks — promotions are supplier-created and fetched from the API

// Fallback icon map for categories returned by the API
const CATEGORY_ICON_FALLBACK = 'pricetag-outline';

export default function HomeScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // ── Fetch promotions ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPromotions();
        if (!cancelled) setPromos(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setPromos([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch categories ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCategories(true);
      try {
        const data = await getCategories();
        if (!cancelled) setCategories(Array.isArray(data) ? data : data.results || []);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch featured listings ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingFeatured(true);
      try {
        const data = await getListings({ featured: true });
        if (!cancelled) setFeatured(Array.isArray(data) ? data : data.results || []);
      } catch {
        if (!cancelled) setFeatured([]);
      } finally {
        if (!cancelled) setLoadingFeatured(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <HomeTopBar onSearchPress={() => navigation.navigate('Search')} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

        {/* ── Hero promo banner (first active promotion) ───────────────── */}
        {promos.length > 0 && (
          <TouchableOpacity
            style={styles.promoBanner}
            onPress={() => navigation.navigate('ProductDetail', { product: { id: promos[0].listingId, title: promos[0].title, price: promos[0].discountedPrice, imageUrl: promos[0].imageUrl } })}
            activeOpacity={0.9}
          >
            {promos[0].badge && (
              <View style={styles.promoTag}>
                <Text style={styles.promoTagText}>{promos[0].badge}</Text>
              </View>
            )}
            <View style={styles.promoText}>
              <Text style={styles.promoHeadline}>{promos[0].title}</Text>
              <Text style={styles.promoSub}>{promos[0].subtitle}</Text>
              <View style={styles.promoPriceRow}>
                <Text style={styles.promoDiscountedPrice}>
                  Rs {parseFloat(promos[0].discountedPrice).toLocaleString()}
                </Text>
                <Text style={styles.promoOriginalPrice}>
                  Rs {parseFloat(promos[0].originalPrice).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.shopNowBtn}
                onPress={() => navigation.navigate('ProductDetail', { product: { id: promos[0].listingId, title: promos[0].title, price: promos[0].discountedPrice, imageUrl: promos[0].imageUrl } })}
              >
                <Text style={styles.shopNowText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
            {promos[0].imageUrl ? (
              <Image source={{ uri: promos[0].imageUrl }} style={styles.promoImage} />
            ) : (
              <View style={styles.promoImagePlaceholder}>
                <Ionicons name="pricetag" size={32} color="rgba(255,255,255,0.6)" />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* ── Quick navigation icons ────────────────────────────────────── */}
        <View style={styles.sectionPad}>
          <View style={styles.quickRow}>
            {QUICK_CATEGORIES.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickItem}
                onPress={() => navigation.navigate('MarketplaceBrowsing')}
              >
                <View style={styles.quickIcon}>
                  <Ionicons name={`${item.icon}-outline`} size={22} color={colors.primary} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Categories (API-backed) ───────────────────────────────────── */}
        {!loadingCategories && categories.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MarketplaceBrowsing')}>
                <Text style={styles.viewAll}>View all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => String(item.id || item.name)}
              contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.catCard}
                  onPress={() => navigation.navigate('MarketplaceBrowsing', { category: item.name })}
                >
                  <View style={styles.catIconWrap}>
                    <Ionicons
                      name={item.icon || CATEGORY_ICON_FALLBACK}
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ padding: 8 }}>
                    <Text style={styles.catName} numberOfLines={1}>{item.name}</Text>
                    {item.count != null && (
                      <Text style={styles.catSub}>{item.count} listings</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Featured listings ─────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MarketplaceBrowsing')}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {loadingFeatured ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featured}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
            ListEmptyComponent={
              <Text style={{ color: colors.textSecondary, paddingHorizontal: spacing.md, fontSize: 13 }}>
                No featured products right now.
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.featCard}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.featImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.featImage, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="image-outline" size={28} color={colors.textLight} />
                  </View>
                )}
                {item.isFeatured && (
                  <View style={styles.featBadge}>
                    <Text style={styles.featBadgeText}>Featured</Text>
                  </View>
                )}
                <View style={{ padding: 8 }}>
                  <Text style={styles.featPrice}>Rs {item.price}</Text>
                  <Text style={styles.featTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={10} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* ── Special Offers (supplier-created promotions only) ─────────── */}
        {promos.length > 0 && (
          <View style={styles.sectionPad}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            {promos.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.promoTile}
                onPress={() => navigation.navigate('ProductDetail', { product: { id: p.listingId, title: p.title, price: p.discountedPrice, imageUrl: p.imageUrl } })}
              >
                {p.imageUrl ? (
                  <Image
                    source={{ uri: p.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.promoTileFallbackBg]} />
                )}
                <View style={styles.promoTileOverlay}>
                  <View style={styles.promoTileRow}>
                    <View style={styles.promoDiscountBadge}>
                      <Text style={styles.promoDiscountBadgeText}>{p.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.promoTileTitle}>{p.title}</Text>
                  <View style={styles.promoTilePriceRow}>
                    <Text style={styles.promoTileDiscPrice}>
                      Rs {parseFloat(p.discountedPrice).toLocaleString()}
                    </Text>
                    <Text style={styles.promoTileOrigPrice}>
                      Rs {parseFloat(p.originalPrice).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.promoTileSub}>{p.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      <BottomNav activeTab="home" />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Hero banner
  promoBanner: {
    margin: spacing.md, backgroundColor: colors.accent,
    borderRadius: radii.xl, flexDirection: 'row', overflow: 'hidden', padding: spacing.md,
  },
  promoText: { flex: 1, paddingRight: 8 },
  promoTag: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: radii.full,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6,
  },
  promoTagText: { color: '#fff', fontSize: 10, fontFamily: fonts.medium },
  promoHeadline: { color: '#fff', fontSize: 16, fontFamily: fonts.bold, marginBottom: 4, lineHeight: 22 },
  promoSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: fonts.regular, marginBottom: 10 },
  shopNowBtn: {
    backgroundColor: '#fff', borderRadius: radii.full,
    paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start',
  },
  shopNowText: { color: colors.accent, fontSize: 12, fontFamily: fonts.semiBold },
  promoImage:            { width: 90, height: 90, borderRadius: radii.lg, alignSelf: 'center' },
  promoImagePlaceholder: { width: 90, height: 90, borderRadius: radii.lg, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  promoPriceRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  promoDiscountedPrice:  { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
  promoOriginalPrice:    { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: fonts.regular, textDecorationLine: 'line-through' },

  // Sections
  sectionPad: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  viewAll: { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },

  // Quick navigation icons
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', gap: 6 },
  quickIcon: {
    width: 56, height: 56, borderRadius: radii.xl,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  quickLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.textSecondary },

  // Category cards
  catCard: {
    width: 110, backgroundColor: colors.surface,
    borderRadius: radii.xl, overflow: 'hidden', ...shadows.sm,
  },
  catIconWrap: {
    width: '100%', height: 80, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  catName: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.text },
  catSub: { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },

  // Featured listing cards
  featCard: {
    width: 160, backgroundColor: colors.surface,
    borderRadius: radii.xl, overflow: 'hidden', ...shadows.sm,
  },
  featImage: { width: '100%', height: 100 },
  featBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: colors.accent, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  featBadgeText: { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },
  featPrice: { color: colors.accent, fontSize: 14, fontFamily: fonts.bold, marginBottom: 2 },
  featTitle: { color: colors.text, fontSize: 11, fontFamily: fonts.medium, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: colors.textSecondary, fontFamily: fonts.regular },

  // Promo tiles
  promoTile: {
    height: 130, borderRadius: radii.xl, overflow: 'hidden',
    marginBottom: 12, justifyContent: 'flex-end',
  },
  promoTileFallbackBg: { backgroundColor: colors.primary },
  promoTileOverlay:    { padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.48)' },
  promoTileRow:        { flexDirection: 'row', marginBottom: 4 },
  promoDiscountBadge:  { backgroundColor: colors.accent, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  promoDiscountBadgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.semiBold },
  promoTileTitle:      { color: '#fff', fontSize: 14, fontFamily: fonts.bold, marginBottom: 2 },
  promoTilePriceRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  promoTileDiscPrice:  { color: '#fff', fontSize: 14, fontFamily: fonts.bold },
  promoTileOrigPrice:  { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: fonts.regular, textDecorationLine: 'line-through' },
  promoTileSub:        { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: fonts.regular },
});