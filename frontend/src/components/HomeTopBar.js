// HomeTopBar — redesigned as a full hero header.
//
// Layout:
//   Top row : greeting + name (left)  |  notification bell + avatar (right)
//   Bottom  : frosted pill search bar (tapping calls onSearchPress)
//
// The whole zone has curved bottom corners and casts a soft primary-tinted
// shadow onto the scroll content below.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { useUser } from '../context/UserContext';

export default function HomeTopBar({ onSearchPress }) {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t }      = useLanguage();
  const { user }   = useUser();

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';
  const initial   = (user?.name || 'N').charAt(0).toUpperCase();

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
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.75)" />
            <Text style={styles.location}>Lahore, PK</Text>
          </View>
        </View>

        <View style={styles.topRight}>
          {/* Notification bell */}
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.primary }]} />
          </TouchableOpacity>

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
  notifBtn: {
    padding: 5,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
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
