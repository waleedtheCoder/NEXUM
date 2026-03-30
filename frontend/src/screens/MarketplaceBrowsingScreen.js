import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import FilterChip from '../components/FilterChip';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getListings, toggleSaveListing } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

const SORT_OPTIONS = [
  { label: 'Newest',  value: 'newest'    },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc'},
];

export default function MarketplaceBrowsingScreen() {
  
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeSort, setActiveSort] = useState('newest');
  const [viewMode, setViewMode]   = useState('grid');
  const [searchText, setSearchText] = useState('');
  const [saved, setSaved]         = useState(new Set());

  const searchTimer = useRef(null);

  const fetchProducts = useCallback(
    async ({ sort = activeSort, q = searchText } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getListings({ sort, q: q.trim() || undefined });
        setProducts(data);
      } catch (err) {
        setError(err.message || 'Failed to load listings.');
      } finally {
        setLoading(false);
      }
    },
    [activeSort, searchText]
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
    const price   = parseFloat(item.price).toLocaleString();
    const isSaved = saved.has(item.id);

    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={styles.listCard}
          onPress={() => navigation.navigate('ProductDetail', { product: item })}
          activeOpacity={0.88}
        >
          {/* Left accent bar */}
          <View style={styles.listAccentBar} />

          {/* Image */}
          <View style={styles.listImgWrap}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.listImg} resizeMode="cover" />
            ) : (
              <View style={[styles.listImg, styles.listImgPlaceholder]}>
                <Ionicons name="cube-outline" size={26} color={colors.textLight} />
              </View>
            )}
            {item.isFeatured && (
              <View style={styles.featBadge}><Text style={styles.featText}>Featured</Text></View>
            )}
          </View>

          {/* Info */}
          <View style={styles.listInfo}>
            <View style={styles.listCategoryRow}>
              <View style={styles.categoryChip}>
                <Text style={styles.categoryChipText} numberOfLines={1}>{item.category || 'General'}</Text>
              </View>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
            <Text style={styles.listPrice}>Rs {price}</Text>
            <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
            </View>
          </View>

          {/* Heart */}
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
        {/* Image zone */}
        <View style={styles.gridImgWrap}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.gridImg} resizeMode="cover" />
          ) : (
            <View style={[styles.gridImg, styles.gridImgPlaceholder]}>
              <Ionicons name="cube-outline" size={30} color={colors.textLight} />
            </View>
          )}

          {/* Heart — top right */}
          <TouchableOpacity style={styles.heartOverlay} onPress={() => toggleSave(item.id)}>
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={15}
              color={isSaved ? '#EF4444' : '#fff'}
            />
          </TouchableOpacity>

          {/* Featured badge — top left */}
          {item.isFeatured && (
            <View style={styles.featBadge}><Text style={styles.featText}>Featured</Text></View>
          )}
        </View>

        {/* Content */}
        <View style={styles.gridInfo}>
          {/* Category chip */}
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText} numberOfLines={1}>{item.category || 'General'}</Text>
          </View>

          {/* Price — prominent, primary color */}
          <Text style={styles.gridPrice}>Rs {price}</Text>

          {/* Title */}
          <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>

          {/* Footer: location */}
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
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Search bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or suppliers…"
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
      </View>

      {/* Sort chips */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SORT_OPTIONS}
          keyExtractor={(f) => f.value}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              active={activeSort === item.value}
              onPress={() => setActiveSort(item.value)}
            />
          )}
        />
      </View>

      {/* Result count + view toggle */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {loading ? 'Loading…' : `${products.length} result${products.length !== 1 ? 's' : ''}`}
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
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProducts()}>
            <Text style={styles.retryText}>Retry</Text>
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
              <Text style={styles.errorText}>No products found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.backgroundAlt, borderRadius: radii.full,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput:   { flex: 1, color: colors.text, fontSize: 13, fontFamily: fonts.regular },
  filterRow:     { paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.surface },
  resultsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  resultsText:   { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.regular },
  viewToggle:    { flexDirection: 'row', gap: 6 },
  viewBtn:       { padding: 7, borderRadius: radii.md, backgroundColor: colors.surface },
  viewBtnActive: { backgroundColor: colors.primary },
  listContent:   { paddingHorizontal: spacing.md, paddingBottom: 32 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  errorText:  { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  retryBtn:   { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.full },
  retryText:  { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },

  // ── Grid card ──────────────────────────────────────────────────────────────
  gridCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    // Floating shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  gridImgWrap:       { width: '100%', aspectRatio: 1, position: 'relative' },
  gridImg:           { width: '100%', height: '100%' },
  gridImgPlaceholder:{ backgroundColor: colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' },

  heartOverlay: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 14, padding: 6,
  },

  gridInfo: { padding: 10, gap: 4 },

  gridPrice: {
    fontSize: 16, fontFamily: fonts.bold,
    color: colors.primary,   // teal (light) / rust-orange (dark)
  },
  gridTitle: {
    fontSize: 11, fontFamily: fonts.medium,
    color: colors.text, lineHeight: 16,
  },
  gridFooter: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },

  // ── List card ──────────────────────────────────────────────────────────────
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: 12,
    // Floating shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  listAccentBar: {
    width: 4,
    backgroundColor: colors.primary,
  },
  listImgWrap:        { width: 100, position: 'relative' },
  listImg:            { width: 100, height: '100%', minHeight: 100 },
  listImgPlaceholder: { backgroundColor: colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' },

  listInfo: { flex: 1, padding: 12, gap: 3, justifyContent: 'center' },
  listCategoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  listPrice: { fontSize: 17, fontFamily: fonts.bold, color: colors.primary },
  listTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text, lineHeight: 18 },

  heartBtn: { paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  timeText: { fontSize: 10, color: colors.textLight, fontFamily: fonts.regular },

  // ── Shared ─────────────────────────────────────────────────────────────────
  featBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: colors.accent,   // orange (light) / teal (dark)
    borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  featText: { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },

  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}18`,
    borderRadius: radii.full,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: `${colors.primary}30`,
  },
  categoryChipText: {
    fontSize: 9, fontFamily: fonts.semiBold,
    color: colors.primary, maxWidth: 80,
  },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: colors.textSecondary, fontFamily: fonts.regular, flex: 1 },
});