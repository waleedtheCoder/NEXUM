import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SectionList, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Accent color per section — maps section title to { bg, icon }
const SECTION_COLORS = {
  'FOOD & GROCERY':    { bg: '#FEF3C7', icon: '#D97706' },
  'SNACKS & BEVERAGES':{ bg: '#DBEAFE', icon: '#2563EB' },
  'HOME & HYGIENE':    { bg: '#D1FAE5', icon: '#059669' },
};
const FALLBACK_COLOR = { bg: '#F3E8FF', icon: '#7C3AED' };
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { getCategories } from '../services/marketplaceApi';

export default function CategoryBrowseScreen() {
  const { colors } = useTheme();
  const { t, isUrdu } = useLanguage();
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

        // API returns flat array: [{ id, section, name, icon }]
        // Group by section for SectionList
        const grouped = {};
        data.forEach((item) => {
          const key = item.section || 'OTHER';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });

        setSections(
          Object.entries(grouped).map(([title, items]) => ({ title, data: items }))
        );
      } catch (err) {
        if (!cancelled) setError(t.categoryBrowse.failedLoad);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={t.categoryBrowse.title} showBack />

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!!error && !loading && (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{error || t.categoryBrowse.failedLoad}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setError(null); setLoading(true); }}
          >
            <Text style={styles.retryText}>{t.categoryBrowse.retry}</Text>
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
            const sc = SECTION_COLORS[section.title] || FALLBACK_COLOR;
            return (
              <TouchableOpacity
                style={[styles.row, !isLast && styles.rowBorder]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  navigation.navigate('CategoryListings', { category: item.name });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: sc.bg }]}>
                  <Ionicons name={item.icon || 'pricetag-outline'} size={20} color={sc.icon} />
                </View>
                <Text style={styles.rowText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 24 },
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
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
});
