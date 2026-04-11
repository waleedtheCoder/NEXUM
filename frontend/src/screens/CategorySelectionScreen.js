import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SectionList, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getCategories } from '../services/marketplaceApi';

// IDs of the 6 "popular" categories — matches the original POPULAR list
const POPULAR_IDS = new Set(['1', '2', '3', '4', '5', '6']);

export default function CategorySelectionScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
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
                  <Ionicons name={item.icon || 'pricetag-outline'} size={20} color={colors.primary} />
                </View>
                <Text style={styles.rowText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: 16, paddingTop: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: fonts.semiBold, color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.lg },
  errorText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: colors.primary, borderRadius: radii.full,
  },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
  sectionLabel: {
    fontSize: 11, fontFamily: fonts.semiBold, color: colors.textSecondary,
    letterSpacing: 0.8, paddingHorizontal: spacing.md, paddingVertical: 10,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconTile: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
});
