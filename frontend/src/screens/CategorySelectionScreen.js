import React from 'react';
import {
  View, Text, TouchableOpacity, SectionList, StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radii } from '../constants/theme';

const POPULAR = [
  { id: '1', name: 'Rice & Grains', icon: 'leaf' },
  { id: '2', name: 'Flour & Atta', icon: 'bag' },
  { id: '3', name: 'Pulses & Lentils (Daal)', icon: 'restaurant' },
  { id: '4', name: 'Cooking Oil & Ghee', icon: 'water' },
  { id: '5', name: 'Sugar & Salt', icon: 'cube' },
  { id: '6', name: 'Spices & Masalas', icon: 'flame' },
];

const ALL = [
  { id: '7', name: 'Tea & Coffee', icon: 'cafe' },
  { id: '8', name: 'Dry Fruits & Nuts', icon: 'nutrition' },
  { id: '9', name: 'Packaged Snacks & Biscuits', icon: 'fast-food' },
  { id: '10', name: 'Beverages & Soft Drinks', icon: 'beer' },
  { id: '11', name: 'Dairy Products', icon: 'flask' },
  { id: '12', name: 'Frozen Foods', icon: 'snow' },
  { id: '13', name: 'Cleaning & Household Supplies', icon: 'sparkles' },
  { id: '14', name: 'Wholesale Packaging Materials', icon: 'archive' },
];

export default function CategorySelectionScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // FIX: navigate to CreateListing (form) not MobileListing (browse)
  const navigate = (category) => navigation.navigate('CreateListing', { category });

  const sections = [
    { title: 'POPULAR CATEGORIES', data: POPULAR },
    { title: 'ALL CATEGORIES', data: ALL },
  ];

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
              onPress={() => navigate(item.name)}
              activeOpacity={0.7}
            >
              <View style={styles.iconTile}>
                <Ionicons name={item.icon} size={20} color="#F9FAFB" />
              </View>
              <Text style={styles.rowText}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(249,250,251,0.4)" />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#F9FAFB' },
  sectionLabel: {
    fontSize: 11, fontFamily: fonts.semiBold, color: 'rgba(249,250,251,0.4)',
    letterSpacing: 0.8, paddingHorizontal: spacing.md, paddingTop: 20, paddingBottom: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  iconTile: {
    width: 40, height: 40, borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: '#F9FAFB' },
});
