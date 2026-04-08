import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function HomeTopBar() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, backgroundColor: colors.primary }]}>
      <View style={styles.left}>
        <Text style={styles.logo}>NEXUM</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.location}>Lahore, PK</Text>
        </View>
      </View>
      <View style={styles.right}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.primary }]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
  },
  left: {},
  logo: { color: '#fff', fontSize: 20, fontFamily: fonts.bold, letterSpacing: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  location: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: fonts.regular },
  right: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
});
