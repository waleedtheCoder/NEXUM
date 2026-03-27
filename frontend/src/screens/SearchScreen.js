import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';
import { searchListings } from '../services/marketplaceApi';

// These are static suggestion chips — no API equivalent in v2.0
const POPULAR_SUPPLIERS = ['Rice Mills', 'Flour Suppliers', 'Cooking Oil', 'Spice Traders', 'Dairy Farms'];
const POPULAR_PRODUCTS = ['Basmati Rice 25kg', 'Wheat Flour', 'Sugar 50kg', 'Cooking Oil', 'Tea Bags', 'Salt'];

const INITIAL_RECENTS = [];

export default function SearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recents, setRecents] = useState(INITIAL_RECENTS);
  const searchTimer = useRef(null);

  const addRecent = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRecents((prev) =>
      [{ id: Date.now().toString(), text: trimmed }, ...prev.filter((r) => r.text.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5)
    );
  };

  const removeRecent = (id) => setRecents((prev) => prev.filter((r) => r.id !== id));

  const doSearch = async (text) => {
    const q = text.trim();
    if (!q) return;
    addRecent(q);
    setSubmitted(true);
    setLoading(true);
    try {
      const data = await searchListings(q);
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => doSearch(query);

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
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or suppliers..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={(t) => { setQuery(t); if (!t) clearSearch(); }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
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
                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={52} color={colors.border} />
                <Text style={styles.emptyText}>No products found for "{query}"</Text>
                <Text style={styles.emptySubText}>Try a different keyword</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultCard}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.resultImg} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.resultPrice}>
                    Rs {parseFloat(item.price).toLocaleString()}
                  </Text>
                  <View style={styles.resultMeta}>
                    <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.resultLocation}>{item.location}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              </TouchableOpacity>
            )}
          />
        )
      ) : (
        /* Discovery view — static chips + recent searches */
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          ListHeaderComponent={
            <View style={styles.scroll}>
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
                        <TouchableOpacity onPress={() => removeRecent(r.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
                <View style={styles.chips}>
                  {POPULAR_PRODUCTS.map((p) => (
                    <TouchableOpacity key={p} style={styles.chip} onPress={() => handleChipPress(p)}>
                      <Ionicons name="cube-outline" size={14} color={colors.primary} />
                      <Text style={styles.chipText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Popular suppliers */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Suppliers</Text>
                <View style={styles.chips}>
                  {POPULAR_SUPPLIERS.map((s) => (
                    <TouchableOpacity key={s} style={styles.chip} onPress={() => handleChipPress(s)}>
                      <Ionicons name="business-outline" size={14} color={colors.accent} />
                      <Text style={styles.chipText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          }
        />
      )}

      <BottomNav activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.sm, marginBottom: 10,
    ...shadows.sm,
  },
  resultImg: { width: 64, height: 64, borderRadius: radii.md },
  resultInfo: { flex: 1, gap: 3 },
  resultTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  resultPrice: { fontSize: 14, fontFamily: fonts.bold, color: colors.accent },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  resultLocation: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
  emptySubText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textLight },
  scroll: { padding: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  clearAll: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },
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
});
