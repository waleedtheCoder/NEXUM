import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import ListingCard from '../components/ListingCard';
import { colors, fonts, spacing, radii } from '../constants/theme';

const TABS = ['active', 'pending', 'removed'];

const DUMMY_LISTINGS = [
  { id: '1', productName: 'Premium Basmati Rice', category: 'Grocery', quantity: '500', unit: 'kg', pricePerUnit: 180, totalValue: 90000, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop', postedDate: '2 days ago', location: 'Karachi', views: 143, inquiries: 12 },
  { id: '2', productName: 'Hand Sanitizer Gel 500ml', category: 'Hygiene', quantity: '1000', unit: 'bottles', pricePerUnit: 95, totalValue: 95000, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=300&h=300&fit=crop', postedDate: '1 week ago', location: 'Lahore', views: 267, inquiries: 28 },
  { id: '3', productName: 'Cooking Oil (Vegetable)', category: 'Grocery', quantity: '200', unit: 'liters', pricePerUnit: 320, totalValue: 64000, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop', postedDate: '3 days ago', location: 'Faisalabad', views: 89, inquiries: 7 },
  { id: '4', productName: 'Antibacterial Soap Bars', category: 'Personal Care', quantity: '2000', unit: 'pieces', pricePerUnit: 35, totalValue: 70000, status: 'pending', imageUrl: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=300&h=300&fit=crop', postedDate: '5 hours ago', location: 'Islamabad', views: 12, inquiries: 0 },
  { id: '5', productName: 'Shampoo Bottles 400ml', category: 'Personal Care', quantity: '800', unit: 'bottles', pricePerUnit: 145, totalValue: 116000, status: 'pending', imageUrl: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=300&h=300&fit=crop', postedDate: '1 day ago', location: 'Multan', views: 34, inquiries: 2 },
  { id: '6', productName: 'Wheat Flour Premium', category: 'Grocery', quantity: '1000', unit: 'kg', pricePerUnit: 75, totalValue: 75000, status: 'removed', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop', postedDate: '2 weeks ago', location: 'Karachi', views: 421, inquiries: 35 },
];

export default function MyListingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = DUMMY_LISTINGS.filter((l) => l.status === activeTab);

  // FIX: counts derived from data instead of hardcoded
  const counts = {
    active: DUMMY_LISTINGS.filter((l) => l.status === 'active').length,
    pending: DUMMY_LISTINGS.filter((l) => l.status === 'pending').length,
    removed: DUMMY_LISTINGS.filter((l) => l.status === 'removed').length,
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Listings ({counts[activeTab]})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CategorySelection')}>
            <View style={styles.addBtn}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* FIX: promote banner now has onPress */}
      <TouchableOpacity
        style={styles.promoteBanner}
        onPress={() => Alert.alert('Promote Products', 'Sponsored listing feature coming soon!')}
      >
        <View style={styles.promoteBannerIcon}>
          <Ionicons name="pricetag" size={18} color="#fff" />
        </View>
        <Text style={styles.promoteBannerText}>Promote Your Products</Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => navigation.navigate('MyListingsManagement', { listing: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={60} color="#374151" />
            <Text style={styles.emptyText}>No {activeTab} listings yet</Text>
            {activeTab === 'active' && (
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => navigation.navigate('CategorySelection')}
              >
                <Text style={styles.emptyActionText}>Add Your First Listing</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />

      <BottomNav activeTab="listings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  header: { backgroundColor: '#0D0F12', paddingHorizontal: spacing.md, paddingBottom: 0 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 22, fontFamily: fonts.bold, color: '#fff' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 7,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontFamily: fonts.medium },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  tabText: { fontSize: 13, fontFamily: fonts.medium, color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  tabIndicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, backgroundColor: colors.primary, borderRadius: 1 },
  promoteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  promoteBannerIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  promoteBannerText: { flex: 1, color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
  listContent: { padding: spacing.md, paddingBottom: 24 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 14 },
  emptyText: { color: '#6B7280', fontSize: 15, fontFamily: fonts.regular },
  emptyAction: {
    backgroundColor: colors.primary, borderRadius: radii.lg,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyActionText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
});
