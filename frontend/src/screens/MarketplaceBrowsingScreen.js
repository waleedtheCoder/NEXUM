import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import FilterChip from '../components/FilterChip';
import { SkeletonGridCard, SkeletonListCard } from '../components/SkeletonLoader';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { getListings, toggleSaveListing } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

const SORT_OPTIONS = [
  { labelKey: 'newest',    value: 'newest'     },
  { labelKey: 'priceUp',   value: 'price_asc'  },
  { labelKey: 'priceDown', value: 'price_desc' },
];

export default function MarketplaceBrowsingScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t }      = useLanguage();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const paramCategory   = route.params?.category   || null;
  const paramOffersOnly = route.params?.offersOnly  || false;

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeSort, setActiveSort] = useState('newest');
  const [viewMode,   setViewMode]   = useState('grid');
  const [searchText, setSearchText] = useState('');
  const [saved,      setSaved]      = useState(new Set());

  const searchTimer = useRef(null);

  const fetchProducts = useCallback(
    async ({ sort = activeSort, q = searchText } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getListings({
          sort,
          q: q.trim() || undefined,
          category: paramCategory || undefined,
          on_promo: paramOffersOnly || undefined,
        });
        setProducts(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        setError(err.message || 'Failed to load listings.');
      } finally {
        setLoading(false);
      }
    },
    [activeSort, searchText, paramCategory, paramOffersOnly]
  );

  useEffect(() => {
    fetchProducts({ sort: activeSort });
  }, [activeSort]);

  const handleSearchChange = (text) => {
    setSearchText(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchProducts({ sort: activeSort, q: text });
    }, 400);
  };

  const toggleSave = async (id) => {
    const willSave = !saved.has(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSaved((prev) => {
      const next = new Set(prev);
      willSave ? next.add(id) : next.delete(id);
      return next;
    });
    if (idToken || sessionId) {
      try {
        await toggleSaveListing(id, willSave, {
          idToken, sessionId, refreshToken,
          onTokenRefreshed: (t) => updateUser({ idToken: t }),
        });
      } catch {
        setSaved((prev) => {
          const next = new Set(prev);
          willSave ? next.delete(id) : next.add(id);
          return next;
        });
      }
    }
  };

  const styles = makeStyles(colors);

  const renderCard = ({ item }) => {
    const promo        = item.promotion || null;
    const priceStr     = parseFloat(promo ? promo.discountedPrice : item.price).toLocaleString();
    const origPriceStr = promo ? parseFloat(item.price).toLocaleString() : null;
    const isSaved      = saved.has(item.id);

    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={styles.listCard}
          onPress={() => navigation.navigate('ProductDetail', { product: item })}
          activeOpacity={0.88}
        >
          <View style={[styles.listAccentBar, { backgroundColor: colors.primary }]} />
          <View style={styles.listImgWrap}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.listImg} resizeMode="cover" />
            ) : (
              <View style={[styles.listImg, styles.listImgPlaceholder]}>
                <Ionicons name="cube-outline" size={26} color={colors.textLight} />
              </View>
            )}
            {item.isFeatured && (
              <View style={styles.featBadge}><Text style={styles.featText}>{t.marketplace.featured}</Text></View>
            )}
            {promo && (
              <View style={[styles.featBadge, { bottom: 8, top: 'auto', backgroundColor: '#10B981' }]}>
                <Text style={styles.featText}>{promo.discountPercent}% OFF</Text>
              </View>
            )}
          </View>
          <View style={styles.listInfo}>
            <View style={styles.listCategoryRow}>
              <View style={styles.categoryChip}>
                <Text style={styles.categoryChipText} numberOfLines={1}>
                  {item.category || t.marketplace.general}
                </Text>
              </View>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.listPrice}>Rs {priceStr}</Text>
              {origPriceStr && <Text style={styles.origPrice}>Rs {origPriceStr}</Text>}
            </View>
            <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.heartBtn} onPress={() => toggleSave(item.id)}>
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={20}
              color={isSaved ? '#EF4444' : colors.textLight}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    // Grid card
    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        activeOpacity={0.88}
      >
        <View style={styles.gridImgWrap}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.gridImg} resizeMode="cover" />
          ) : (
            <View style={[styles.gridImg, styles.gridImgPlaceholder]}>
              <Ionicons name="cube-outline" size={30} color={colors.textLight} />
            </View>
          )}
          <TouchableOpacity style={styles.heartOverlay} onPress={() => toggleSave(item.id)}>
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={14}
              color={isSaved ? '#EF4444' : '#fff'}
            />
          </TouchableOpacity>
          {item.isFeatured && (
            <View style={styles.featBadge}><Text style={styles.featText}>{t.marketplace.featured}</Text></View>
          )}
          {promo && (
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>{promo.discountPercent}% OFF</Text>
            </View>
          )}
        </View>
        <View style={styles.gridInfo}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText} numberOfLines={1}>
              {item.category || t.marketplace.general}
            </Text>
          </View>
          <Text style={styles.gridPrice}>Rs {priceStr}</Text>
          {origPriceStr && <Text style={styles.origPrice}>Rs {origPriceStr}</Text>}
          <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.gridFooter}>
            <Ionicons name="location-outline" size={10} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        {(paramCategory || paramOffersOnly) ? (
          <>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {paramOffersOnly ? t.home.offers : paramCategory}
            </Text>
            {/* Search remains available on category pages */}
            <View style={styles.searchBarCompact}>
              <Ionicons name="search" size={14} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInputCompact}
                placeholder={t.marketplace.searchPlaceholder}
                placeholderTextColor={colors.textLight}
                value={searchText}
                onChangeText={handleSearchChange}
                returnKeyType="search"
              />
            </View>
          </>
        ) : (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t.marketplace.searchPlaceholder}
              placeholderTextColor={colors.textLight}
              value={searchText}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchText(''); fetchProducts({ sort: activeSort, q: '' }); }}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── Sort chips ─────────────────────────────────────────────────── */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SORT_OPTIONS}
          keyExtractor={(f) => f.value}
          renderItem={({ item }) => (
            <FilterChip
              label={t.marketplace[item.labelKey] || item.labelKey}
              active={activeSort === item.value}
              onPress={() => setActiveSort(item.value)}
            />
          )}
        />
      </View>

      {/* ── Results bar ────────────────────────────────────────────────── */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {loading ? t.marketplace.loading : `${products.length} ${t.marketplace.results}`}
        </Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}
          >
            <Ionicons name="grid" size={16} color={viewMode === 'grid' ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
          >
            <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          key={`skeleton-${viewMode}`}
          keyExtractor={(i) => String(i)}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={() =>
            viewMode === 'grid'
              ? <SkeletonGridCard />
              : <SkeletonListCard />
          }
        />
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProducts()}>
            <Text style={styles.retryText}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          key={viewMode}
          keyExtractor={(item) => String(item.id)}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={48} color={colors.textLight} />
              <Text style={styles.errorText}>{t.marketplace.noProducts}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomLeftRadius:  20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
    paddingHorizontal: 4,
    minWidth: 80,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13, fontFamily: fonts.regular },
  searchBarCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundAlt,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInputCompact: { flex: 1, color: colors.text, fontSize: 12, fontFamily: fonts.regular },
  filterRow:   { paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.surface },
  resultsRow:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  resultsText:   { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.regular },
  viewToggle:    { flexDirection: 'row', gap: 6 },
  viewBtn:       { padding: 7, borderRadius: radii.md, backgroundColor: colors.surface },
  viewBtnActive: { backgroundColor: colors.primary },
  listContent:   { paddingHorizontal: spacing.md, paddingBottom: 32, paddingTop: 4 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  errorText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  retryBtn:  { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.full },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },

  // ── Grid card ─────────────────────────────────────────────────────────────
  gridCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 7,
  },
  gridImgWrap:        { width: '100%', aspectRatio: 1, position: 'relative' },
  gridImg:            { width: '100%', height: '100%' },
  gridImgPlaceholder: { backgroundColor: colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' },
  heartOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    padding: 6,
  },
  gridInfo:  { padding: 10, gap: 4 },
  gridPrice: { fontSize: 16, fontFamily: fonts.bold, color: colors.primary },
  origPrice: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, textDecorationLine: 'line-through' },
  gridTitle: { fontSize: 11, fontFamily: fonts.medium, color: colors.text, lineHeight: 16 },
  gridFooter:{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },

  // ── List card ─────────────────────────────────────────────────────────────
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 6,
  },
  listAccentBar:      { width: 4 },
  listImgWrap:        { width: 100, position: 'relative' },
  listImg:            { width: 100, height: '100%', minHeight: 100 },
  listImgPlaceholder: { backgroundColor: colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' },
  listInfo:           { flex: 1, padding: 12, gap: 3, justifyContent: 'center' },
  listCategoryRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  listPrice: { fontSize: 17, fontFamily: fonts.bold, color: colors.primary },
  listTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text, lineHeight: 18 },
  heartBtn:  { paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  timeText:  { fontSize: 10, color: colors.textLight, fontFamily: fonts.regular },

  // ── Shared ────────────────────────────────────────────────────────────────
  featBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
  },
  featText: { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },
  promoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#10B981',
    borderRadius: radii.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
  },
  promoBadgeText: { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}18`,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${colors.primary}28`,
  },
  categoryChipText: { fontSize: 9, fontFamily: fonts.semiBold, color: colors.primary, maxWidth: 80 },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: colors.textSecondary, fontFamily: fonts.regular, flex: 1 },
});
