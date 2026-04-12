import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, StatusBar, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import BottomNav from '../components/BottomNav';
import HomeTopBar from '../components/HomeTopBar';
import PressableBounce from '../components/PressableBounce';
import { SkeletonFeaturedCard } from '../components/SkeletonLoader';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { getListings, getCategories, getPromotions } from '../services/marketplaceApi';
import { formatPrice } from '../utils/format';

const QUICK_CATEGORIES = [
  { icon: 'pricetag',    labelKey: 'offers'        },
];

const CATEGORY_ICON_FALLBACK = 'pricetag-outline';

const QUICK_COLORS = [
  { bg: '#FFF1E6', icon: '#F97316' },
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t }      = useLanguage();
  const styles     = makeStyles(colors);
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();

  const [categories,        setCategories]        = useState([]);
  const [featured,          setFeatured]          = useState([]);
  const [promos,            setPromos]            = useState([]);
  const [loadingFeatured,   setLoadingFeatured]   = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

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
    // HomeTopBar handles its own safe-area top padding — don't double-apply it
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <HomeTopBar onSearchPress={() => navigation.navigate('Search')} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >

        {/* ── Fallback banner when no live promos ──────────────────────── */}
        {promos.length === 0 && (
          <TouchableOpacity
            style={[styles.promoBanner, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              navigation.navigate('MarketplaceBrowsing', { offersOnly: true });
            }}
            activeOpacity={0.92}
          >
            <View style={styles.promoDecorCircle} />
            <View style={styles.promoTextZone}>
              <Text style={styles.promoHeadline}>{t.home.exploreDeals}</Text>
              <Text style={styles.promoSub}>{t.home.exploreDealsSub}</Text>
              <View style={styles.shopNowBtn}>
                <Text style={[styles.shopNowText, { color: colors.primary }]}>{t.home.shopNow}</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primary} />
              </View>
            </View>
            <View style={styles.promoImagePlaceholder}>
              <Ionicons name="pricetag" size={36} color="rgba(255,255,255,0.55)" />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Hero promo banner ─────────────────────────────────────────── */}
        {promos.length > 0 && (
          <TouchableOpacity
            style={[styles.promoBanner, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('ProductDetail', {
              product: {
                id: promos[0].listingId,
                title: promos[0].title,
                price: promos[0].discountedPrice,
                imageUrl: promos[0].imageUrl,
              },
            })}
            activeOpacity={0.92}
          >
            {/* Decorative translucent circle */}
            <View style={styles.promoDecorCircle} />

            {promos[0].badge && (
              <View style={styles.promoTag}>
                <Text style={styles.promoTagText}>{promos[0].badge}</Text>
              </View>
            )}
            <View style={styles.promoTextZone}>
              <Text style={styles.promoHeadline}>{promos[0].title}</Text>
              <Text style={styles.promoSub}>{promos[0].subtitle}</Text>
              <View style={styles.promoPriceRow}>
                <Text style={styles.promoDiscountedPrice}>
                  {formatPrice(promos[0].discountedPrice)}
                </Text>
                <Text style={styles.promoOriginalPrice}>
                  {formatPrice(promos[0].originalPrice)}
                </Text>
              </View>
              {/* 3D-style Shop Now pill — tap handled by outer TouchableOpacity */}
              <View style={styles.shopNowBtn}>
                <Text style={[styles.shopNowText, { color: colors.accent }]}>{t.home.shopNow}</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.accent} />
              </View>
            </View>
            {promos[0].imageUrl ? (
              <Image source={{ uri: promos[0].imageUrl }} style={styles.promoImage} />
            ) : (
              <View style={styles.promoImagePlaceholder}>
                <Ionicons name="pricetag" size={36} color="rgba(255,255,255,0.55)" />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* ── Quick navigation icons ────────────────────────────────────── */}
        <View style={styles.sectionPad}>
          <View style={styles.quickRow}>
            {QUICK_CATEGORIES.map((item, i) => {
              const qc = QUICK_COLORS[i % QUICK_COLORS.length];
              return (
                <PressableBounce
                  key={i}
                  style={styles.quickItem}
                  onPress={() => navigation.navigate(
                    'MarketplaceBrowsing',
                    item.labelKey === 'offers' ? { offersOnly: true } : {}
                  )}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: qc.bg }]}>
                    <Ionicons name={`${item.icon}-outline`} size={22} color={qc.icon} />
                  </View>
                  <Text style={styles.quickLabel}>{t.home[item.labelKey]}</Text>
                </PressableBounce>
              );
            })}
          </View>
        </View>

        {/* ── Categories (API-backed) ───────────────────────────────────── */}
        {!loadingCategories && categories.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.home.browseCategories}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MarketplaceBrowsing')}>
                <Text style={styles.viewAll}>{t.home.viewAll}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => String(item.id || item.name)}
              contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 10 }}
              renderItem={({ item }) => (
                <PressableBounce
                  style={styles.catCard}
                  onPress={() => navigation.navigate('MarketplaceBrowsing', { category: item.name })}
                >
                  <View style={[styles.catIconWrap, { backgroundColor: `${colors.primary}18` }]}>
                    <Ionicons
                      name={item.icon || CATEGORY_ICON_FALLBACK}
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={styles.catName} numberOfLines={1}>{item.name}</Text>
                    {item.count != null && (
                      <Text style={styles.catSub}>{item.count} {t.home.listings}</Text>
                    )}
                  </View>
                </PressableBounce>
              )}
            />
          </View>
        )}

        {/* ── Featured listings ─────────────────────────────────────────── */}
        {(!loadingFeatured || featured.length > 0) && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.home.featuredProducts}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MarketplaceBrowsing')}>
              <Text style={styles.viewAll}>{t.home.viewAll}</Text>
            </TouchableOpacity>
          </View>
        )}
        {loadingFeatured ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[1, 2, 3]}
            keyExtractor={(i) => String(i)}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12, paddingVertical: 4 }}
            renderItem={() => <SkeletonFeaturedCard />}
          />
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featured}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
            ListEmptyComponent={null}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.featCard}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
                activeOpacity={0.88}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.featImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.featImage, styles.featImagePlaceholder]}>
                    <Ionicons name="cube-outline" size={28} color={colors.textLight} />
                  </View>
                )}
                {item.isFeatured && (
                  <View style={styles.featBadge}>
                    <Text style={styles.featBadgeText}>{t.home.featured}</Text>
                  </View>
                )}
                <View style={styles.featBody}>
                  <Text style={styles.featPrice}>{formatPrice(item.price)}</Text>
                  <Text style={styles.featTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.featMeta}>
                    <Ionicons name="location-outline" size={10} color={colors.textSecondary} />
                    <Text style={styles.featMetaText} numberOfLines={1}>{item.location}</Text>
                  </View>
                </View>
                <View style={styles.featFooter}>
                  <Text style={styles.featSupplier} numberOfLines={1}>
                    {item.supplierName || item.seller?.name || 'View details'}
                  </Text>
                  <View style={[styles.featOrderBtn, {
                    backgroundColor: colors.primary,
                    borderBottomColor: colors.primaryDark,
                  }]}>
                    <Text style={styles.featOrderBtnText}>Order</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* ── Special Offers (supplier promos) ─────────────────────────── */}
        {promos.length > 0 && (
          <View style={styles.sectionPad}>
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>{t.home.specialOffers}</Text>
            {promos.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.promoTile}
                onPress={() => navigation.navigate('ProductDetail', {
                  product: { id: p.listingId, title: p.title, price: p.discountedPrice, imageUrl: p.imageUrl },
                })}
                activeOpacity={0.88}
              >
                {p.imageUrl ? (
                  <Image source={{ uri: p.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
                )}
                <View style={styles.promoTileOverlay}>
                  <View style={styles.promoTileRow}>
                    <View style={[styles.promoDiscountBadge, { backgroundColor: colors.accent }]}>
                      <Text style={styles.promoDiscountBadgeText}>{p.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.promoTileTitle}>{p.title}</Text>
                  <View style={styles.promoTilePriceRow}>
                    <Text style={styles.promoTileDiscPrice}>{formatPrice(p.discountedPrice)}</Text>
                    <Text style={styles.promoTileOrigPrice}>{formatPrice(p.originalPrice)}</Text>
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

  // ── Hero promo banner ──────────────────────────────────────────────────────
  promoBanner: {
    margin: spacing.md,
    borderRadius: radii.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: spacing.md,
    position: 'relative',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 10,
  },
  promoDecorCircle: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  promoTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  promoTagText:  { color: '#fff', fontSize: 10, fontFamily: fonts.medium },
  promoTextZone: { flex: 1, paddingRight: 8, paddingTop: 28 },
  promoHeadline: { color: '#fff', fontSize: 15, fontFamily: fonts.bold, marginBottom: 4, lineHeight: 21 },
  promoSub:      { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: fonts.regular, marginBottom: 8 },
  promoPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  promoDiscountedPrice: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
  promoOriginalPrice:   {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: fonts.regular,
    textDecorationLine: 'line-through',
  },
  shopNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    borderBottomWidth: 3,
    borderBottomColor: '#E0DDD8',
  },
  shopNowText: { fontSize: 12, fontFamily: fonts.semiBold },
  promoImage: { width: 90, height: 90, borderRadius: radii.lg, alignSelf: 'center' },
  promoImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: radii.lg,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ── Sections ───────────────────────────────────────────────────────────────
  sectionPad: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  viewAll:      { fontSize: 13, fontFamily: fonts.semiBold, color: colors.primary },

  // ── Quick nav icons ────────────────────────────────────────────────────────
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', gap: 6 },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 4,
  },
  quickLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.textSecondary },

  // ── Category cards ─────────────────────────────────────────────────────────
  catCard: {
    width: 116,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 5,
  },
  catIconWrap: { width: '100%', height: 80, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.text },
  catSub:  { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },

  // ── Featured listing cards ─────────────────────────────────────────────────
  featCard: {
    width: 165,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 7,
  },
  featImage: { width: '100%', height: 105 },
  featImagePlaceholder: {
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
  },
  featBadgeText: { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },
  featBody: { padding: 10, paddingBottom: 6 },
  featPrice: { color: colors.accent, fontSize: 14, fontFamily: fonts.bold, marginBottom: 3 },
  featTitle: { color: colors.text, fontSize: 11, fontFamily: fonts.medium, lineHeight: 15, marginBottom: 4 },
  featMeta:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featMetaText: { fontSize: 10, color: colors.textSecondary, fontFamily: fonts.regular, flex: 1 },
  featFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surfaceAlt,
  },
  featSupplier: { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary, flex: 1 },
  featOrderBtn: {
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderBottomWidth: 2,
  },
  featOrderBtnText: { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },

  // ── Promo offer tiles ──────────────────────────────────────────────────────
  promoTile: {
    height: 130,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  promoTileOverlay:    { padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.48)' },
  promoTileRow:        { flexDirection: 'row', marginBottom: 4 },
  promoDiscountBadge:  { borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  promoDiscountBadgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.semiBold },
  promoTileTitle:      { color: '#fff', fontSize: 14, fontFamily: fonts.bold, marginBottom: 2 },
  promoTilePriceRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  promoTileDiscPrice:  { color: '#fff', fontSize: 14, fontFamily: fonts.bold },
  promoTileOrigPrice:  { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: fonts.regular, textDecorationLine: 'line-through' },
  promoTileSub:        { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: fonts.regular },
});
