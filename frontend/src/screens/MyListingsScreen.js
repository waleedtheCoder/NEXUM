import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import ListingCard from '../components/ListingCard';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getMyListings } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

const TABS = ['active', 'pending', 'removed'];

export default function MyListingsScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  const fetchListings = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getMyListings(authArgs);
      setAllListings(data);
    } catch (err) {
      setError(err.message || 'Failed to load listings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload whenever screen comes into focus (e.g. after creating a listing)
  useFocusEffect(
    useCallback(() => {
      fetchListings({ silent: false });
    }, [idToken, sessionId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings({ silent: true });
  };

  const filtered = allListings.filter((l) => l.status === activeTab);

  const counts = {
    active: allListings.filter((l) => l.status === 'active').length,
    pending: allListings.filter((l) => l.status === 'pending').length,
    removed: allListings.filter((l) => l.status === 'removed').length,
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

      <TouchableOpacity
        style={styles.promoteBanner}
        onPress={() => Alert.alert('Promote a Listing', 'Open any active listing below and tap "Put on Promotion" to set a discount.')}
      >
        <View style={styles.promoteBannerIcon}>
          <Ionicons name="pricetag" size={18} color="#fff" />
        </View>
        <Text style={styles.promoteBannerText}>Promote Your Products</Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </TouchableOpacity>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color="#374151" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchListings()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ListingCard
              listing={{ ...item, pricePerUnit: parseFloat(item.pricePerUnit) }}
              onPress={() => navigation.navigate('MyListingsManagement', { listing: item })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={60} color="#374151" />
              <Text style={styles.emptyText}>No {activeTab} listings yet</Text>
              {activeTab === 'active' && (
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => navigation.navigate('CategorySelection')}
                >
                  <Text style={styles.emptyActionText}>Create your first listing</Text>
                </TouchableOpacity>
              )}
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
  header: { backgroundColor: '#0D0F12', paddingHorizontal: spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 20, fontFamily: fonts.bold, color: '#fff' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 7,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontFamily: fonts.semiBold },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 10, position: 'relative' },
  tabText: { fontSize: 13, fontFamily: fonts.medium, color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  tabIndicator: {
    position: 'absolute', bottom: -1, left: '20%', right: '20%',
    height: 2, backgroundColor: colors.primary, borderRadius: 1,
  },
  promoteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.accent, margin: spacing.md, borderRadius: radii.xl,
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  promoteBannerIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  promoteBannerText: { flex: 1, color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: '#9CA3AF', fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.full },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: fonts.regular, color: '#6B7280' },
  emptyAction: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: colors.primary, borderRadius: radii.full,
  },
  emptyActionText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
});
