import React, { useState } from 'react';
import { View, FlatList, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import FilterChip from '../components/FilterChip';
import ProductCard from '../components/ProductCard';
import BottomNav from '../components/BottomNav';
import { colors, spacing } from '../constants/theme';

const FILTERS = ['All', 'Grains', 'Oils', 'Spices', 'Dairy', 'Hygiene'];

const PRODUCTS = [
  { id: '1', title: 'Premium Basmati Rice 25kg', price: 8800, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop', isFeatured: true },
  { id: '2', title: 'Bulk Cooking Oil Carton', price: 12500, imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop', isFeatured: false },
  { id: '3', title: 'Wholesale Sugar Bags 50kg', price: 6400, imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop', isFeatured: true },
  { id: '4', title: 'Hand Sanitizer Gel 500ml x20', price: 1900, imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=300&h=300&fit=crop', isFeatured: false },
  { id: '5', title: 'Tea Bags Box of 500', price: 3200, imageUrl: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=300&h=300&fit=crop', isFeatured: false },
  { id: '6', title: 'Wheat Flour Premium 100kg', price: 7500, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop', isFeatured: true },
];

export default function MobileListingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const categoryTitle = route.params?.category || 'Listings';
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={categoryTitle} showBack />

      <View style={styles.filterWrap}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f}
          renderItem={({ item }) => (
            <FilterChip
              label={item}
              active={activeFilter === item}
              onPress={() => setActiveFilter(item)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
        />
      </View>

      <FlatList
        data={PRODUCTS}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.colWrap}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ProductCard
              product={item}
              viewMode="grid"
              onPress={() => navigation.navigate('ProductDetail', { product: item })}
            />
          </View>
        )}
        contentContainerStyle={styles.grid}
      />

      <BottomNav activeTab="listings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterWrap: { borderBottomWidth: 1, borderBottomColor: colors.border },
  colWrap: { paddingHorizontal: spacing.md, gap: 12 },
  cardWrap: { flex: 1 },
  grid: { paddingTop: spacing.md, paddingBottom: 16 },
});
