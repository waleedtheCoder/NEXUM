import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import FilterChip from '../components/FilterChip';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';

const FILTERS = ['Category', 'Brand', 'Price', 'Location'];

const PRODUCTS = [
  { id: 1, title: 'Premium Basmati Rice 25kg', price: 8800, location: 'Lahore Wholesale Market', time: '2 hours ago', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop' },
  { id: 2, title: 'Bulk Cooking Oil Carton', price: 12500, location: 'Karachi Trade Center', time: '5 hours ago', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop' },
  { id: 3, title: 'Wholesale Sugar Bags', price: 6400, location: 'Faisalabad Market', time: '1 day ago', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop' },
  { id: 4, title: 'Tea Pack Distributor Bundle', price: 9900, location: 'Islamabad Wholesale Hub', time: '3 hours ago', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop' },
  { id: 5, title: 'Hand Sanitizer Gel 500ml x20', price: 1900, location: 'Karachi', time: '1 hour ago', isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=300&h=300&fit=crop' },
  { id: 6, title: 'Wheat Flour Premium 100kg', price: 7500, location: 'Lahore', time: '6 hours ago', isFeatured: true, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop' },
];

export default function MarketplaceBrowsingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('Category');
  const [viewMode, setViewMode] = useState('grid');
  const [saved, setSaved] = useState(new Set());

  const toggleSave = (id) => {
    setSaved((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const renderCard = ({ item }) => {
    if (viewMode === 'list') {
      return (
        <TouchableOpacity style={styles.listCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
          <Image source={{ uri: item.imageUrl }} style={styles.listImg} />
          <View style={styles.listInfo}>
            {item.isFeatured && <View style={styles.featBadge}><Text style={styles.featText}>Featured</Text></View>}
            <Text style={styles.price}>Rs {item.price.toLocaleString()}</Text>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.heartBtn}>
            <Ionicons name={saved.has(item.id) ? 'heart' : 'heart-outline'} size={20} color={colors.green} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: item.imageUrl }} style={styles.gridImg} />
          {item.isFeatured && <View style={styles.featBadge}><Text style={styles.featText}>Featured</Text></View>}
          <TouchableOpacity style={styles.heartOverlay} onPress={() => toggleSave(item.id)}>
            <Ionicons name={saved.has(item.id) ? 'heart' : 'heart-outline'} size={16} color={colors.green} />
          </TouchableOpacity>
        </View>
        <View style={styles.gridInfo}>
          <Text style={styles.price}>Rs {item.price.toLocaleString()}</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput style={styles.searchInput} placeholder="Search products or suppliers…" placeholderTextColor={colors.textLight} />
        </View>
      </View>
      <View style={styles.filterRow}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f}
          renderItem={({ item }) => (
            <FilterChip label={item} active={activeFilter === item} onPress={() => setActiveFilter(item)} />
          )}
        />
      </View>
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>Showing {PRODUCTS.length.toLocaleString()}+ results</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity onPress={() => setViewMode('grid')} style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}>
            <Ionicons name="grid" size={16} color={viewMode === 'grid' ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}>
            <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={PRODUCTS}
        key={viewMode}
        keyExtractor={(item) => String(item.id)}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radii.full,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13, fontFamily: fonts.regular },
  filterRow: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  resultsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: 10,
  },
  resultsText: { color: '#9CA3AF', fontSize: 12, fontFamily: fonts.regular },
  viewToggle: { flexDirection: 'row', gap: 6 },
  viewBtn: { padding: 7, borderRadius: 8, backgroundColor: '#374151' },
  viewBtnActive: { backgroundColor: colors.primary },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: 24 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  gridCard: { flex: 1, backgroundColor: '#1F2937', borderRadius: radii.xl, overflow: 'hidden' },
  gridImg: { width: '100%', aspectRatio: 1 },
  gridInfo: { padding: 10 },
  listCard: {
    flexDirection: 'row', backgroundColor: '#1F2937',
    borderRadius: radii.xl, overflow: 'hidden', marginBottom: 12,
  },
  listImg: { width: 100, height: 100 },
  listInfo: { flex: 1, padding: 12 },
  featBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  featText: { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },
  heartOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 6,
  },
  heartBtn: { padding: 12, justifyContent: 'center' },
  price: { color: colors.accent, fontSize: 15, fontFamily: fonts.bold, marginBottom: 2 },
  title: { color: '#fff', fontSize: 13, fontFamily: fonts.medium, marginBottom: 4 },
  titleSmall: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: fonts.regular, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: colors.textSecondary, fontFamily: fonts.regular },
});
