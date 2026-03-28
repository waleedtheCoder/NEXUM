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
          activeOpacity={0.85}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.listImg} resizeMode="cover" />
          <View style={styles.listInfo}>
            {item.isFeatured && (
              <View style={styles.featBadge}><Text style={styles.featText}>Featured</Text></View>
            )}
            <Text style={styles.price}>Rs {price}</Text>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <TouchableOpacity style={styles.heartBtn} onPress={() => toggleSave(item.id)}>
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={18}
              color={isSaved ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        activeOpacity={0.85}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.gridImg} resizeMode="cover" />
        {item.isFeatured && (
          <View style={styles.featBadge}><Text style={styles.featText}>Featured</Text></View>
        )}
        <TouchableOpacity style={styles.heartOverlay} onPress={() => toggleSave(item.id)}>
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={16}
            color={isSaved ? colors.accent : colors.green}
          />
        </TouchableOpacity>
        <View style={styles.gridInfo}>
          <Text style={styles.price}>Rs {price}</Text>
          <Text style={styles.titleSmall} numberOfLines={2}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.location}</Text>
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
  container:  { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceAlt, borderRadius: radii.full,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput:  { flex: 1, color: colors.text, fontSize: 13, fontFamily: fonts.regular },
  filterRow:    { paddingHorizontal: spacing.md, paddingVertical: 10 },
  resultsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: 10,
  },
  resultsText:  { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.regular },
  viewToggle:   { flexDirection: 'row', gap: 6 },
  viewBtn:      { padding: 7, borderRadius: 8, backgroundColor: colors.surfaceAlt },
  viewBtnActive:{ backgroundColor: colors.primary },
  listContent:  { paddingHorizontal: spacing.md, paddingBottom: 24 },
  columnWrapper:{ gap: 12, marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  errorText:    { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  retryBtn:     { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.full },
  retryText:    { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },

  // Grid card
  gridCard:    { flex: 1, backgroundColor: colors.surface, borderRadius: radii.xl, overflow: 'hidden' },
  gridImg:     { width: '100%', aspectRatio: 1 },
  gridInfo:    { padding: 10 },
  heartOverlay:{
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: `${colors.surface}CC`, borderRadius: 14, padding: 6,
  },

  // List card
  listCard: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radii.xl, overflow: 'hidden', marginBottom: 12,
  },
  listImg:  { width: 100, height: 100 },
  listInfo: { flex: 1, padding: 12 },
  heartBtn: { padding: 12, justifyContent: 'center' },
  timeText: { fontSize: 10, color: colors.textLight, fontFamily: fonts.regular, marginTop: 2 },

  // Shared
  featBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  featText:   { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },
  price:      { color: colors.accent, fontSize: 15, fontFamily: fonts.bold, marginBottom: 2 },
  title:      { color: colors.text, fontSize: 13, fontFamily: fonts.medium, marginBottom: 4 },
  titleSmall: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.regular, marginBottom: 4 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:   { fontSize: 10, color: colors.textSecondary, fontFamily: fonts.regular },
});