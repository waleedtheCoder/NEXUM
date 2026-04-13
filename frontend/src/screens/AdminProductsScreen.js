import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../hooks/useTheme';
import { getAdminListings } from '../services/adminApi';
import { fonts, spacing, radii } from '../constants/theme';

const STATUS_COLORS = {
  active:  { bg: '#F0FDF4', text: '#16A34A' },
  pending: { bg: '#FFFBEB', text: '#D97706' },
  removed: { bg: '#FEF2F2', text: '#DC2626' },
};

export default function AdminProductsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [query,    setQuery]    = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminListings();
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load products.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.supplier_name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q),
    );
  }, [products, query]);

  const renderItem = ({ item }) => {
    const sc = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('ProductDetail', {
          product: {
            id:          item.id,
            title:       item.title,
            price:       item.price,
            imageUrl:    item.imageUrl,
            category:    item.category,
            location:    item.location,
            cities:      item.cities,
            supplierName: item.supplier_name,
            supplierId:  item.supplier_id,
          },
        })}
        activeOpacity={0.82}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbPlaceholder, { backgroundColor: colors.backgroundAlt }]}>
            <Ionicons name="cube-outline" size={22} color={colors.textLight} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={[styles.supplier, { color: colors.textSecondary }]} numberOfLines={1}>
            by {item.supplier_name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.price, { color: colors.accent }]}>Rs {item.price}</Text>
            <Text style={[styles.meta, { color: colors.textLight }]}>{item.category}</Text>
            <Text style={[styles.meta, { color: colors.textLight }]}>{item.created_at}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="All Products" subtitle={`${products.length} listings`} showBack />

      <View style={[styles.searchWrap, { backgroundColor: colors.surface }]}>
        <Ionicons name="search-outline" size={18} color={colors.textLight} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name, supplier or category..."
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={40} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 24, gap: 10 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { alignItems: 'center', paddingTop: 60, gap: 12 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: 4,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.regular, padding: 0 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radii.xl,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  thumbnail: { width: 60, height: 60, borderRadius: radii.md },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  title:     { fontSize: 13, fontFamily: fonts.semiBold, flex: 1 },
  statusBadge: { borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:  { fontSize: 10, fontFamily: fonts.semiBold },
  supplier:  { fontSize: 12, fontFamily: fonts.regular, marginBottom: 6 },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price:     { fontSize: 13, fontFamily: fonts.bold },
  meta:      { fontSize: 11, fontFamily: fonts.regular },
  errorText: { fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  emptyText: { fontSize: 14, fontFamily: fonts.regular },
});
