import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';

const POPULAR_SUPPLIERS = ['Rice Mills', 'Flour Suppliers', 'Cooking Oil', 'Spice Traders', 'Dairy Farms'];
const POPULAR_PRODUCTS = ['Basmati Rice 25kg', 'Wheat Flour', 'Sugar 50kg', 'Cooking Oil', 'Tea Bags', 'Salt'];

const ALL_PRODUCTS = [
  { id: '1', title: 'Premium Basmati Rice 25kg', price: 8800, location: 'Lahore', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop' },
  { id: '2', title: 'Bulk Cooking Oil Carton', price: 12500, location: 'Karachi', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop' },
  { id: '3', title: 'Wholesale Sugar Bags 50kg', price: 6400, location: 'Faisalabad', imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop' },
  { id: '4', title: 'Wheat Flour Premium 100kg', price: 7500, location: 'Lahore', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop' },
  { id: '5', title: 'Tea Bags Box of 500', price: 3200, location: 'Islamabad', imageUrl: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=300&h=300&fit=crop' },
  { id: '6', title: 'Hand Sanitizer Gel 500ml', price: 1900, location: 'Karachi', imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=300&h=300&fit=crop' },
  { id: '7', title: 'Rice Mills Basmati Sella', price: 9200, location: 'Sialkot', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop' },
  { id: '8', title: 'Flour Suppliers Atta 50kg', price: 4800, location: 'Lahore', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop' },
];

const INITIAL_RECENTS = [
  { id: '1', text: 'Basmati Rice' },
  { id: '2', text: 'Cooking Oil Bulk' },
];

export default function SearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [recents, setRecents] = useState(INITIAL_RECENTS);

  const removeRecent = (id) => setRecents((prev) => prev.filter((r) => r.id !== id));

  // FIX: actual search logic — filters products by query
  const results = ALL_PRODUCTS.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearch = (q) => {
    const text = (q || query).trim();
    if (!text) return;
    // Add to recents if not already there
    if (!recents.find((r) => r.text.toLowerCase() === text.toLowerCase())) {
      setRecents((prev) => [{ id: Date.now().toString(), text }, ...prev].slice(0, 5));
    }
    setSubmitted(true);
  };

  const handleChipPress = (text) => {
    setQuery(text);
    setSubmitted(true);
    if (!recents.find((r) => r.text.toLowerCase() === text.toLowerCase())) {
      setRecents((prev) => [{ id: Date.now().toString(), text }, ...prev].slice(0, 5));
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSubmitted(false);
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
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or suppliers..."
            placeholderTextColor={colors.textLight}
            value={query}
            onChangeText={(t) => { setQuery(t); setSubmitted(false); }}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results view */}
      {submitted ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
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
                <Text style={styles.resultPrice}>Rs {item.price.toLocaleString()}</Text>
                <View style={styles.resultMeta}>
                  <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.resultLocation}>{item.location}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          ListHeaderComponent={
            <View style={styles.scroll}>
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
                      <View key={r.id} style={styles.recentChip}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <TouchableOpacity onPress={() => handleChipPress(r.text)}>
                          <Text style={styles.chipText}>{r.text}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeRecent(r.id)}>
                          <Ionicons name="close" size={13} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Searches in Suppliers</Text>
                <View style={styles.chips}>
                  {POPULAR_SUPPLIERS.map((s, i) => (
                    <TouchableOpacity key={i} style={styles.popularChip} onPress={() => handleChipPress(s)}>
                      <Text style={styles.popularChipText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Searches in Products</Text>
                <View style={styles.chips}>
                  {POPULAR_PRODUCTS.map((p, i) => (
                    <TouchableOpacity key={i} style={styles.popularChip} onPress={() => handleChipPress(p)}>
                      <Text style={styles.popularChipText}>{p}</Text>
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
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 10,
  },
  backBtn: { padding: 4 },
  searchRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: 24 },
  section: { marginBottom: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text },
  clearAll: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 7,
  },
  chipText: { fontSize: 13, fontFamily: fonts.regular, color: colors.text },
  popularChip: {
    backgroundColor: 'rgba(15,118,110,0.07)', borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.2)', borderRadius: radii.full,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  popularChipText: { fontSize: 13, fontFamily: fonts.regular, color: colors.primary },
  resultsList: { padding: spacing.md, paddingBottom: 24 },
  resultsHeader: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: spacing.md },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radii.md,
    padding: 10, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  resultImg: { width: 64, height: 64, borderRadius: radii.sm, backgroundColor: colors.border },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text, marginBottom: 4 },
  resultPrice: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.primary, marginBottom: 4 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  resultLocation: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text },
  emptySubText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
});
