import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Image, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { searchListings, getTrendingSearch } from '../services/marketplaceApi';

const FILTER_CONDITIONS = ['New', 'Bulk Wholesale', 'Clearance Stock'];
const FILTER_UNITS = ['kg', 'liters', 'pieces', 'boxes', 'cartons', 'bags', 'bottles'];

// Static fallbacks — shown while the API loads or if it fails
const POPULAR_PRODUCTS_FALLBACK = [
  'Basmati Rice 25kg', 'Wheat Flour', 'Sugar 50kg', 'Cooking Oil', 'Tea Bags', 'Salt',
];
const POPULAR_SUPPLIERS_FALLBACK = [
  'Rice Mills', 'Flour Suppliers', 'Cooking Oil', 'Spice Traders', 'Dairy Farms',
];

export default function SearchScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recents, setRecents] = useState([]);
  const searchTimer = useRef(null);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filterVisible, setFilterVisible] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterUnit, setFilterUnit] = useState('');

  const hasActiveFilters = !!(priceMin || priceMax || filterCondition || filterUnit);

  const clearFilters = () => {
    setPriceMin(''); setPriceMax(''); setFilterCondition(''); setFilterUnit('');
  };

  // ── Trending chips (live) ───────────────────────────────────────────────────
  const [popularProducts, setPopularProducts] = useState(POPULAR_PRODUCTS_FALLBACK);
  const [popularSuppliers, setPopularSuppliers] = useState(POPULAR_SUPPLIERS_FALLBACK);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTrendingLoading(true);
      try {
        const data = await getTrendingSearch();
        if (!cancelled) {
          if (Array.isArray(data.popularProducts) && data.popularProducts.length > 0) {
            setPopularProducts(data.popularProducts);
          }
          if (Array.isArray(data.popularSuppliers) && data.popularSuppliers.length > 0) {
            setPopularSuppliers(data.popularSuppliers);
          }
        }
      } catch {
        // Keep fallback values — fail silently
      } finally {
        if (!cancelled) setTrendingLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addRecent = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRecents((prev) =>
      [
        { id: Date.now().toString(), text: trimmed },
        ...prev.filter((r) => r.text.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 5)
    );
  };

  const removeRecent = (id) => setRecents((prev) => prev.filter((r) => r.id !== id));

  const doSearch = async (text, filters = {}) => {
    const q = text.trim();
    if (!q) return;
    addRecent(q);
    setSubmitted(true);
    setLoading(true);
    try {
      const data = await searchListings(q, {
        price_min: filters.priceMin,
        price_max: filters.priceMax,
        condition: filters.condition,
        unit: filters.unit,
      });
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => doSearch(query, { priceMin, priceMax, condition: filterCondition, unit: filterUnit });

  const activeFilters = () => ({ priceMin, priceMax, condition: filterCondition, unit: filterUnit });

  const handleChipPress = (text) => {
    setQuery(text);
    doSearch(text);
  };

  const clearSearch = () => {
    setQuery('');
    setSubmitted(false);
    setResults([]);
    if (searchTimer.current) clearTimeout(searchTimer.current);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Search bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or suppliers…"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color="#fff" />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Results or suggestion chips */}
      {submitted ? (
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.resultsList}
            ListHeaderComponent={
              <Text style={styles.resultsHeader}>
                {results.length} result{results.length !== 1 ? 's' : ''}
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="search-outline" size={48} color={colors.textLight} />
                <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: fonts.regular, marginTop: 8 }}>
                  No results found
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultCard}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.resultImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.resultImage, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="image-outline" size={22} color={colors.textLight} />
                  </View>
                )}
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.resultPrice}>Rs {item.price}</Text>
                  <View style={styles.resultMeta}>
                    <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.resultMetaText}>{item.location}</Text>
                    <Text style={styles.resultMetaDot}>·</Text>
                    <Text style={styles.resultMetaText}>{item.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => 'suggestions'}
          ListHeaderComponent={
            <View>
              {/* Recent searches */}
              {recents.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                    <TouchableOpacity onPress={() => setRecents([])}>
                      <Text style={styles.clearAll}>Clear all</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chips}>
                    {recents.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={styles.recentChip}
                        onPress={() => handleChipPress(r.text)}
                      >
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.chipText}>{r.text}</Text>
                        <TouchableOpacity
                          onPress={() => removeRecent(r.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Popular products */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Products</Text>
                {trendingLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                ) : (
                  <View style={styles.chips}>
                    {popularProducts.map((p) => (
                      <TouchableOpacity key={p} style={styles.chip} onPress={() => handleChipPress(p)}>
                        <Ionicons name="cube-outline" size={14} color={colors.primary} />
                        <Text style={styles.chipText}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Popular suppliers */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Suppliers</Text>
                {trendingLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                ) : (
                  <View style={styles.chips}>
                    {popularSuppliers.map((s) => (
                      <TouchableOpacity key={s} style={styles.chip} onPress={() => handleChipPress(s)}>
                        <Ionicons name="business-outline" size={14} color={colors.accent} />
                        <Text style={styles.chipText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          }
          renderItem={null}
        />
      )}

      <BottomNav activeTab="search" />

      {/* Filter Modal */}
      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <TouchableOpacity style={styles.filterBackdrop} activeOpacity={1} onPress={() => setFilterVisible(false)} />
        <View style={[styles.filterSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity onPress={() => { clearFilters(); }}>
              <Text style={styles.clearFiltersText}>Clear all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.filterLabel}>Price Range (Rs)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={[styles.filterInput, styles.flex1]}
                value={priceMin}
                onChangeText={setPriceMin}
                placeholder="Min"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
              <Text style={{ color: colors.textSecondary, alignSelf: 'center' }}>–</Text>
              <TextInput
                style={[styles.filterInput, styles.flex1]}
                value={priceMax}
                onChangeText={setPriceMax}
                placeholder="Max"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.filterLabel}>Condition</Text>
            <View style={styles.filterChips}>
              {FILTER_CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filterChip, filterCondition === c && styles.filterChipActive]}
                  onPress={() => setFilterCondition(filterCondition === c ? '' : c)}
                >
                  <Text style={[styles.filterChipText, filterCondition === c && styles.filterChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Unit</Text>
            <View style={styles.filterChips}>
              {FILTER_UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.filterChip, filterUnit === u && styles.filterChipActive]}
                  onPress={() => setFilterUnit(filterUnit === u ? '' : u)}
                >
                  <Text style={[styles.filterChipText, filterUnit === u && styles.filterChipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.applyFilterBtn}
            onPress={() => {
              setFilterVisible(false);
              if (submitted) doSearch(query, activeFilters());
            }}
          >
            <Text style={styles.applyFilterText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingBottom: 12,
    backgroundColor: colors.primary,
  },
  backBtn: { padding: 4 },
  searchRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radii.full,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontFamily: fonts.regular },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  resultsList: { padding: spacing.md, paddingBottom: 80 },
  resultsHeader: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary, marginBottom: 12 },
  resultCard: {
    flexDirection: 'row', gap: 12, marginBottom: 12,
    backgroundColor: colors.surface, borderRadius: radii.xl, overflow: 'hidden',
    ...shadows.sm,
  },
  resultImage: { width: 90, height: 90 },
  resultInfo: { flex: 1, paddingVertical: 10, paddingRight: 12 },
  resultTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text, marginBottom: 4 },
  resultPrice: { fontSize: 14, fontFamily: fonts.bold, color: colors.accent, marginBottom: 4 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultMetaText: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  resultMetaDot: { fontSize: 11, color: colors.textSecondary },

  section: { padding: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text },
  clearAll: { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: radii.full,
    paddingHorizontal: 12, paddingVertical: 7, ...shadows.sm,
  },
  recentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: radii.full,
    paddingHorizontal: 12, paddingVertical: 7, ...shadows.sm,
  },
  chipText: { fontSize: 13, fontFamily: fonts.regular, color: colors.text },

  // Filter button in top bar
  filterBtn: { padding: 4, position: 'relative' },
  filterDot: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent,
  },

  // Filter modal
  filterBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  filterSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, maxHeight: '75%',
  },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  filterTitle:  { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  clearFiltersText: { fontSize: 13, fontFamily: fonts.medium, color: colors.accent },
  filterLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8, marginTop: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex1: { flex: 1 },
  filterInput: {
    backgroundColor: colors.background, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontFamily: fonts.regular, color: colors.text,
  },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  applyFilterBtn: {
    backgroundColor: colors.primary, borderRadius: radii.xl,
    paddingVertical: 15, alignItems: 'center', marginTop: spacing.md,
  },
  applyFilterText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
});