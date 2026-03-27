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
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';
import { getListings, getCategories } from '../services/marketplaceApi';

// ── Static / navigation-only data (no API equivalent in v2.0) ─────────────────
const QUICK_CATEGORIES = [
  { icon: 'pricetag', label: 'Offers' },
  { icon: 'people', label: 'New Suppliers' },
  { icon: 'trending-up', label: 'Restock Deals' },
  { icon: 'cube', label: 'Bulk Essentials' },
  { icon: 'location', label: 'Local Favorites' },
];

const PROMOS = [
  { title: 'Up to 25% off on staples', sub: 'Rice, wheat, pulses & more', uri: 'https://images.unsplash.com/photo-1720206995413-94eac3307514?w=400&h=160&fit=crop' },
  { title: 'Buy 1 get 1 on hygiene', sub: 'Stock up on essentials', uri: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&h=160&fit=crop' },
  { title: 'Exclusive deals for verified retailers', sub: 'Join 10,000+ retailers', uri: 'https://images.unsplash.com/photo-1685119166946-d4050647b0e3?w=400&h=160&fit=crop' },
];

// Fallback icon map for categories returned by the API
const CATEGORY_ICON_FALLBACK = 'pricetag-outline';

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // ── Fetch categories ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCategories();
        // Show at most 5 for the horizontal scroll strip
        if (!cancelled) setCategories(data.slice(0, 5));
      } catch {
        // Silently fall through — section simply won't render
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch featured listings ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getListings({ featured: true });
        if (!cancelled) setFeaturedListings(data);
      } catch {
        // Silently fall through
      } finally {
        if (!cancelled) setLoadingFeatured(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <HomeTopBar />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Promo hero banner (static) ─────────────────────────────────── */}
        <View style={styles.promoBanner}>
          <View style={styles.promoText}>
            <View style={styles.promoTag}>
              <Text style={styles.promoTagText}>First Order Special</Text>
            </View>
            <Text style={styles.promoHeadline}>Get 20% off your first restock order</Text>
            <Text style={styles.promoSub}>Stock up and save on bulk essentials</Text>
            <TouchableOpacity
              style={styles.shopNowBtn}
              onPress={() => navigation.navigate('MarketplaceBrowsing')}
            >
              <Text style={styles.shopNowText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1685119166946-d4050647b0e3?w=200&h=200&fit=crop' }}
            style={styles.promoImage}
          />
        </View>

        {/* ── Quick categories (static navigation shortcuts) ───────────── */}
        <View style={styles.sectionPad}>
          <View style={styles.quickRow}>
            {QUICK_CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickItem}
                onPress={() => navigation.navigate('CategoryNavigation')}
              >
                <View style={styles.quickIcon}>
                  <Ionicons name={cat.icon} size={26} color={colors.green} />
                </View>
                <Text style={styles.quickLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Shop by Category (API-backed) ─────────────────────────────── */}
        <View style={{ paddingVertical: spacing.md }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CategoryNavigation')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {loadingCats ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginVertical: 16 }}
            />
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.catCard}
                  onPress={() => navigation.navigate('MobileListing', { category: item.name })}
                >
                  <View style={styles.catIconWrap}>
                    <Ionicons
                      name={item.icon || CATEGORY_ICON_FALLBACK}
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={styles.catName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.catSub}>Bulk deals</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* ── Featured Listings (API-backed) ────────────────────────────── */}
        {(loadingFeatured || featuredListings.length > 0) && (
          <View style={{ paddingVertical: spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MarketplaceBrowsing')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {loadingFeatured ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={featuredListings}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.featCard}
                    onPress={() => navigation.navigate('ProductDetail', { product: item })}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.featImage}
                      resizeMode="cover"
                    />
                    <View style={styles.featBadge}>
                      <Text style={styles.featBadgeText}>Featured</Text>
                    </View>
                    <View style={{ padding: 10 }}>
                      <Text style={styles.featPrice}>
                        Rs {parseFloat(item.price).toLocaleString()}
                      </Text>
                      <Text style={styles.featTitle} numberOfLines={2}>{item.title}</Text>
                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{item.location}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {/* ── Special Offers (static promo tiles) ───────────────────────── */}
        <View style={styles.sectionPad}>
          <Text style={styles.sectionTitle}>Special Offers</Text>
          {PROMOS.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={styles.promoTile}
              onPress={() => navigation.navigate('MarketplaceBrowsing')}
            >
              <Image
                source={{ uri: p.uri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <View style={styles.promoTileOverlay}>
                <Text style={styles.promoTileTitle}>{p.title}</Text>
                <Text style={styles.promoTileSub}>{p.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomNav activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Hero
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
  promoImage: { width: 90, height: 90, borderRadius: radii.lg, alignSelf: 'center' },

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

  // Category cards (API-backed, icon-only — no image needed)
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
    height: 120, borderRadius: radii.xl, overflow: 'hidden',
    marginBottom: 12, justifyContent: 'flex-end',
  },
  promoTileOverlay: { padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.45)' },
  promoTileTitle: { color: '#fff', fontSize: 14, fontFamily: fonts.bold },
  promoTileSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: fonts.regular },
});
