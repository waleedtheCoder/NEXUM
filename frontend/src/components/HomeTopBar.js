// HomeTopBar — redesigned as a full hero header.
//
// Layout:
//   Top row : greeting + name (left)  |  notification bell + avatar (right)
//   Bottom  : frosted pill search bar (tapping calls onSearchPress)
//
// The whole zone has curved bottom corners and casts a soft primary-tinted
// shadow onto the scroll content below.

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, ScrollView, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { useUser } from '../context/UserContext';
import { CITIES } from '../constants/cities';

export default function HomeTopBar({ onSearchPress }) {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t }      = useLanguage();
  const { user, city, setShopkeeperCity, role } = useUser();

  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const initial   = (user?.name || 'N').charAt(0).toUpperCase();

  const isShopkeeper = role === 'shopkeeper' || role === 'SHOPKEEPER';
  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectCity = async (selected) => {
    await setShopkeeperCity(selected);
    setModalVisible(false);
    setQuery('');
  };

  return (
    <View style={[styles.hero, {
      paddingTop: insets.top + 14,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
    }]}>

      {/* ── Top row ──────────────────────────────────────────────────────── */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>
            {t.home?.greeting ? `${t.home.greeting}, ${firstName}` : `Hello, ${firstName} 👋`}
          </Text>
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => isShopkeeper && setModalVisible(true)}
            activeOpacity={isShopkeeper ? 0.7 : 1}
          >
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.75)" />
            <Text style={styles.location}>{city || 'Pakistan'}</Text>
            {isShopkeeper && (
              <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.65)" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.topRight}>
          {/* Avatar circle */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
      </View>

      {/* ── Frosted search bar ───────────────────────────────────────────── */}
      <TouchableOpacity style={styles.searchBar} onPress={onSearchPress} activeOpacity={0.85}>
        <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.85)" />
        <Text style={styles.searchPlaceholder}>
          {t.home?.searchPlaceholder || 'Search products & suppliers…'}
        </Text>
        <Ionicons name="options-outline" size={16} color="rgba(255,255,255,0.55)" />
      </TouchableOpacity>

      {/* ── City picker modal ────────────────────────────────────────────── */}
      <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => { setModalVisible(false); setQuery(''); }}
    >
      <Pressable style={styles.modalBackdrop} onPress={() => { setModalVisible(false); setQuery(''); }}>
        <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>Switch City</Text>
          <Text style={styles.modalSubtitle}>Products will be filtered to your selected city</Text>

          {/* Search */}
          <View style={styles.modalSearch}>
            <Ionicons name="search" size={15} color={colors.textSecondary} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search cities..."
              placeholderTextColor={colors.textLight}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.cityGrid}>
              {filteredCities.map((c) => {
                const active = c === city;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cityChip, active && styles.cityChipActive]}
                    onPress={() => handleSelectCity(c)}
                  >
                    {active && <Ionicons name="checkmark" size={13} color={colors.primary} />}
                    <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: 24,
    borderBottomLeftRadius:  32,
    borderBottomRightRadius: 32,
    // Primary-tinted shadow creates depth below the hero
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius:  18,
    elevation:     12,
    // Top-edge inner highlight
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    color: '#fff',
    fontSize: 19,
    fontFamily: fonts.bold,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  location: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontFamily: fonts.regular,
  },

  // Right side icons
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.bold,
  },

  // City modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: '#111',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#6B7280',
    marginBottom: 14,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#111',
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  cityChipActive: {
    backgroundColor: '#E6F4EE',
    borderWidth: 1.5,
    borderColor: '#00A859',
  },
  cityChipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#374151',
  },
  cityChipTextActive: {
    color: '#00A859',
  },

  // Frosted search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontFamily: fonts.regular,
  },
});
