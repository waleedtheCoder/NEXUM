import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Image, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import BottomNav from '../components/BottomNav';
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

const CONDITIONS = ['New', 'Bulk Wholesale', 'Clearance Stock'];

const CATEGORIES = [
  'Rice & Grains', 'Flour & Atta', 'Pulses & Lentils', 'Cooking Oil & Ghee',
  'Sugar & Salt', 'Spices & Masalas', 'Tea & Coffee', 'Dry Fruits & Nuts',
  'Packaged Snacks & Biscuits', 'Beverages & Soft Drinks', 'Dairy Products',
  'Frozen Foods', 'Cleaning & Household', 'Personal Care', 'Packaging Materials',
];

const DEFAULT_FILTERS = {
  condition: null,
  category: null,
  minPrice: '',
  maxPrice: '',
  verifiedOnly: false,
  onPromo: false,
};

export default function MarketplaceBrowsingScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t }      = useLanguage();
  const { idToken, sessionId, refreshToken, updateUser, city } = useUser();

  const paramCategory   = route.params?.category    || null;
  const paramOffersOnly = route.params?.offersOnly  || false;
  const paramFeatured   = route.params?.featured    || false;

  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [activeSort,   setActiveSort]   = useState('newest');
  const [viewMode,     setViewMode]     = useState('grid');
  const [searchText,   setSearchText]   = useState('');
  const [saved,        setSaved]        = useState(new Set());
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters,      setFilters]      = useState(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);

  const searchTimer = useRef(null);

  const activeFilterCount = [
    filters.condition,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.verifiedOnly,
    filters.onPromo,
  ].filter(Boolean).length;

  const fetchProducts = useCallback(
    async ({ sort = activeSort, q = searchText, appliedFilters = filters } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getListings({
          sort,
          q: q.trim() || undefined,
          category: paramCategory || appliedFilters.category || undefined,
          on_promo: paramOffersOnly || appliedFilters.onPromo || undefined,
          featured: paramFeatured || undefined,
          city: city || undefined,
          condition: appliedFilters.condition || undefined,
          min_price: appliedFilters.minPrice || undefined,
          max_price: appliedFilters.maxPrice || undefined,
          verified_only: appliedFilters.verifiedOnly || undefined,
        });
        setProducts(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        setError(err.message || 'Failed to load listings.');
      } finally {
        setLoading(false);
      }
    },
    [activeSort, searchText, paramCategory, paramOffersOnly, paramFeatured, city, filters]
  );

  useEffect(() => {
    fetchProducts({ sort: activeSort });
  }, [activeSort, city, filters]);

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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        {(paramCategory || paramOffersOnly || paramFeatured) ? (
          <>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {paramOffersOnly ? t.home.offers : paramFeatured ? t.home.featured : paramCategory}
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
        <View style={styles.resultsRight}>
          {/* Filter button */}
          <TouchableOpacity
            style={[styles.filterBtn, activeFilterCount > 0 && { backgroundColor: colors.primary }]}
            onPress={() => { setDraftFilters(filters); setFilterVisible(true); }}
          >
            <Ionicons name="options-outline" size={15} color={activeFilterCount > 0 ? '#fff' : colors.text} />
            <Text style={[styles.filterBtnText, activeFilterCount > 0 && { color: '#fff' }]}>Filters</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
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

      {!paramCategory && !paramOffersOnly && !paramFeatured && <BottomNav activeTab="browse" />}

      {/* ── Filter bottom sheet ─────────────────────────────────────────── */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterSheet}>

            <View style={styles.filterSheetHandle} />

            {/* Header */}
            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>Filters</Text>
              <TouchableOpacity onPress={() => { setDraftFilters(DEFAULT_FILTERS); }}>
                <Text style={styles.filterResetText}>Reset all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>

              {/* Condition */}
              <Text style={styles.filterSectionLabel}>Condition</Text>
              <View style={styles.chipWrap}>
                {CONDITIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.optionChip, draftFilters.condition === c && styles.optionChipActive]}
                    onPress={() => setDraftFilters(f => ({ ...f, condition: f.condition === c ? null : c }))}
                  >
                    <Text style={[styles.optionChipText, draftFilters.condition === c && styles.optionChipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category (only when not locked by nav param) */}
              {!paramCategory && (
                <>
                  <Text style={styles.filterSectionLabel}>Category</Text>
                  <View style={styles.chipWrap}>
                    {CATEGORIES.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.optionChip, draftFilters.category === c && styles.optionChipActive]}
                        onPress={() => setDraftFilters(f => ({ ...f, category: f.category === c ? null : c }))}
                      >
                        <Text style={[styles.optionChipText, draftFilters.category === c && styles.optionChipTextActive]}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Price range */}
              <Text style={styles.filterSectionLabel}>Price Range (Rs)</Text>
              <View style={styles.priceRow}>
                <View style={styles.priceInputWrap}>
                  <Text style={styles.priceInputLabel}>Min</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={draftFilters.minPrice}
                    onChangeText={(v) => setDraftFilters(f => ({ ...f, minPrice: v.replace(/[^0-9]/g, '') }))}
                    placeholder="0"
                    placeholderTextColor={colors.textLight}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.priceDash} />
                <View style={styles.priceInputWrap}>
                  <Text style={styles.priceInputLabel}>Max</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={draftFilters.maxPrice}
                    onChangeText={(v) => setDraftFilters(f => ({ ...f, maxPrice: v.replace(/[^0-9]/g, '') }))}
                    placeholder="Any"
                    placeholderTextColor={colors.textLight}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Toggles */}
              <Text style={styles.filterSectionLabel}>Special</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleChip, draftFilters.verifiedOnly && styles.toggleChipActive]}
                  onPress={() => setDraftFilters(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
                >
                  <Ionicons name="shield-checkmark-outline" size={15}
                    color={draftFilters.verifiedOnly ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.toggleChipText, draftFilters.verifiedOnly && styles.toggleChipTextActive]}>
                    Verified Suppliers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleChip, draftFilters.onPromo && styles.toggleChipActive]}
                  onPress={() => setDraftFilters(f => ({ ...f, onPromo: !f.onPromo }))}
                >
                  <Ionicons name="pricetag-outline" size={15}
                    color={draftFilters.onPromo ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.toggleChipText, draftFilters.onPromo && styles.toggleChipTextActive]}>
                    On Sale
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Apply */}
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                setFilters(draftFilters);
                setFilterVisible(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              }}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

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
  topBarTitle: {
    flex: 1, fontSize: 16, fontFamily: fonts.semiBold, color: colors.text,
    paddingHorizontal: 4,
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
  resultsText:   { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.regular, flex: 1 },
  resultsRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surface,
    borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.border,
  },
  filterBtnText: { fontSize: 12, fontFamily: fonts.medium, color: colors.text },
  filterBadge: {
    backgroundColor: '#fff', borderRadius: radii.full,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontSize: 10, fontFamily: fonts.bold, color: colors.primary },
  viewToggle:    { flexDirection: 'row', gap: 6 },
  viewBtn:       { padding: 7, borderRadius: radii.md, backgroundColor: colors.surface },
  viewBtnActive: { backgroundColor: colors.primary },

  // ── Filter sheet ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: spacing.md,
    paddingBottom: 32,
    maxHeight: '88%',
    flexDirection: 'column',
  },
  filterSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  filterSheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  filterSheetTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.text },
  filterResetText:  { fontSize: 13, fontFamily: fonts.medium, color: colors.accent },
  filterSectionLabel: {
    fontSize: 11, fontFamily: fonts.semiBold, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.7,
    marginTop: 16, marginBottom: 10,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: colors.border,
  },
  optionChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionChipText:   { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary },
  optionChipTextActive: { color: '#fff' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceInputWrap: { flex: 1 },
  priceInputLabel: { fontSize: 11, fontFamily: fonts.medium, color: colors.textSecondary, marginBottom: 6 },
  priceInput: {
    backgroundColor: colors.background, borderRadius: radii.md,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, fontFamily: fonts.medium, color: colors.text,
    borderWidth: 1.5, borderColor: colors.border,
  },
  priceDash: { width: 10, height: 2, backgroundColor: colors.border, marginTop: 16 },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: colors.border,
  },
  toggleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleChipText:   { fontSize: 12, fontFamily: fonts.medium, color: colors.textSecondary },
  toggleChipTextActive: { color: '#fff' },
  applyBtn: {
    backgroundColor: colors.primary, borderRadius: radii.xl,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
    borderBottomWidth: 4, borderBottomColor: '#0a524d',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)',
  },
  applyBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
  listContent:   { paddingHorizontal: spacing.md, paddingBottom: 90, paddingTop: 4 },
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
    height: 96,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 6,
  },
  listAccentBar:      { width: 4 },
  listImgWrap:        { width: 96 },
  listImg:            { width: 96, height: 96 },
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
