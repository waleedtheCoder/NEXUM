import React from 'react';
import {
  View, Text, TouchableOpacity, SectionList, StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, spacing, radii } from '../constants/theme';

const SECTIONS = [
  {
    title: 'FOOD & GROCERY',
    data: [
      { id: '1', name: 'Rice & Grains', icon: 'leaf' },
      { id: '2', name: 'Flour & Atta', icon: 'bag' },
      { id: '3', name: 'Pulses & Lentils', icon: 'restaurant' },
      { id: '4', name: 'Cooking Oil & Ghee', icon: 'water' },
      { id: '5', name: 'Sugar & Salt', icon: 'cube' },
      { id: '6', name: 'Spices & Masalas', icon: 'flame' },
      { id: '7', name: 'Tea & Coffee', icon: 'cafe' },
      { id: '8', name: 'Dry Fruits & Nuts', icon: 'nutrition' },
    ],
  },
  {
    title: 'SNACKS & BEVERAGES',
    data: [
      { id: '9', name: 'Packaged Snacks & Biscuits', icon: 'fast-food' },
      { id: '10', name: 'Beverages & Soft Drinks', icon: 'beer' },
      { id: '11', name: 'Dairy Products', icon: 'flask' },
      { id: '12', name: 'Frozen Foods', icon: 'snow' },
    ],
  },
  {
    title: 'HOME & HYGIENE',
    data: [
      { id: '13', name: 'Cleaning & Household', icon: 'sparkles' },
      { id: '14', name: 'Personal Care', icon: 'body' },
      { id: '15', name: 'Packaging Materials', icon: 'archive' },
    ],
  },
];

export default function CategoryNavigationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title="Categories" showBack />

      <SectionList
        sections={SECTIONS}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionLabel}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          const isLast = index === section.data.length - 1;
          return (
            <TouchableOpacity
              style={[styles.row, !isLast && styles.rowBorder]}
              onPress={() => navigation.navigate('MobileListing', { category: item.name })}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.rowText}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 24 },
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
    width: 38, height: 38, borderRadius: radii.md,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
});
