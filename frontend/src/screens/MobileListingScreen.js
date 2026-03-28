import React, { useState, useEffect } from 'react';
import {
  View, FlatList, StyleSheet, StatusBar, ActivityIndicator,
  Text, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import FilterChip from '../components/FilterChip';
import ProductCard from '../components/ProductCard';
import BottomNav from '../components/BottomNav';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getListings } from '../services/marketplaceApi';

const SORT_FILTERS = ['Newest', 'Price ↑', 'Price ↓'];
const SORT_MAP = { 'Newest': 'newest', 'Price ↑': 'price_asc', 'Price ↓': 'price_desc' };

export default function MobileListingScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const categoryTitle = route.params?.category || 'Listings';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Newest');

  const fetchProducts = async (sort = 'newest') => {
    setLoading(true);
    setError(null);
    try {
      const data = await getListings({
        category: categoryTitle !== 'Listings' ? categoryTitle : undefined,
        sort,
      });
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to load listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(SORT_MAP[activeFilter]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryTitle]);

  const handleFilterChange = (label) => {
    setActiveFilter(label);
    fetchProducts(SORT_MAP[label]);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={categoryTitle} showBack />

      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SORT_FILTERS}
          keyExtractor={(f) => f}
          renderItem={({ item }) => (
            <FilterChip
              label={item}
              active={activeFilter === item}
              onPress={() => handleFilterChange(item)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProducts(SORT_MAP[activeFilter])}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={styles.colWrap}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ProductCard
                product={{ ...item, price: parseFloat(item.price) }}
                viewMode="grid"
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
              />
            </View>
          )}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={48} color={colors.textLight} />
              <Text style={styles.errorText}>No listings in this category yet</Text>
            </View>
          }
        />
      )}

      <BottomNav activeTab="listings" />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterWrap: { borderBottomWidth: 1, borderBottomColor: colors.border },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  errorText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.full },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
  colWrap: { paddingHorizontal: spacing.md, gap: 12 },
  cardWrap: { flex: 1 },
  grid: { paddingTop: spacing.md, paddingBottom: 16 },
});
