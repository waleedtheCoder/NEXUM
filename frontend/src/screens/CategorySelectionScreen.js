import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SectionList, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radii } from '../constants/theme';
import { getCategories } from '../services/marketplaceApi';

// IDs of the 6 "popular" categories — matches the original POPULAR list
const POPULAR_IDS = new Set(['1', '2', '3', '4', '5', '6']);

export default function CategorySelectionScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCategories();
        if (cancelled) return;

        const popular = data.filter((c) => POPULAR_IDS.has(c.id));
        const rest = data.filter((c) => !POPULAR_IDS.has(c.id));

        setSections([
          { title: 'POPULAR CATEGORIES', data: popular },
          { title: 'ALL CATEGORIES', data: rest },
        ]);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load categories.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSelect = (categoryName) =>
    navigation.navigate('CreateListing', { category: categoryName });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What are you selling?</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!!error && !loading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setError(null); setLoading(true); }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          )}
          renderItem={({ item, index, section }) => {
            const isLast = index === section.data.length - 1;
            return (
              <TouchableOpacity
                style={[styles.row, !isLast && styles.rowBorder]}
                onPress={() => handleSelect(item.name)}
                activeOpacity={0.7}
              >
                <View style={styles.iconTile}>
                  <Ionicons name={item.icon || 'pricetag-outline'} size={20} color="#F9FAFB" />
                </View>
                <Text style={styles.rowText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: 16, paddingTop: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: fonts.semiBold, color: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.lg },
  errorText: { fontSize: 14, fontFamily: fonts.regular, color: '#9CA3AF', textAlign: 'center' },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: colors.primary, borderRadius: radii.full,
  },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
  sectionLabel: {
    fontSize: 11, fontFamily: fonts.semiBold, color: '#6B7280',
    letterSpacing: 0.8, paddingHorizontal: spacing.md, paddingVertical: 10,
    backgroundColor: '#0D0F12',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: '#111827',
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  iconTile: {
    width: 38, height: 38, borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: '#F9FAFB' },
});
