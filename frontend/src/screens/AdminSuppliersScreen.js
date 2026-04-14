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
import { getAdminSuppliers } from '../services/adminApi';
import { fonts, spacing, radii } from '../constants/theme';

export default function AdminSuppliersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();

  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [query,     setQuery]     = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminSuppliers();
        if (!cancelled) setSuppliers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load suppliers.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return suppliers;
    const q = query.toLowerCase();
    return suppliers.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q),
    );
  }, [suppliers, query]);

  const renderItem = ({ item }) => {
    const initials = (item.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'S';
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => navigation.navigate('AdminUserDetail', { userId: item.id, userName: item.name, role: 'SUPPLIER' })}
        activeOpacity={0.82}
      >
        <View style={[styles.avatar, { backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>{item.email}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="cube-outline" size={11} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>{item.total_listings} listings</Text>
            </View>
            <Text style={[styles.joined, { color: colors.textLight }]}>Joined {item.joined_date}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Suppliers" subtitle={`${suppliers.length} registered`} showBack />

      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface }]}>
        <Ionicons name="search-outline" size={18} color={colors.textLight} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name or email..."
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
              <Ionicons name="people-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No suppliers found.</Text>
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
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: fonts.bold },
  name:       { fontSize: 14, fontFamily: fonts.semiBold, marginBottom: 2 },
  email:      { fontSize: 12, fontFamily: fonts.regular, marginBottom: 6 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontFamily: fonts.medium },
  joined:    { fontSize: 11, fontFamily: fonts.regular },
  errorText: { fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  emptyText: { fontSize: 14, fontFamily: fonts.regular },
});
