// frontend/src/components/ScreenHeader.js
//
// Bubbly 3D redesign: curved bottom corners, downward shadow, optional subtitle.
// The primary-colored zone acts as the "context band" for the screen.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { fonts } from '../constants/theme';

export default function ScreenHeader({
  title,
  subtitle,           // optional — renders below title in the colored zone
  showBack = true,
  rightElement = null,
}) {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, {
      paddingTop: insets.top + 8,
      backgroundColor: colors.primary,
      // Downward shadow so the header visually lifts above the screen content
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 14,
      elevation: 10,
    }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Main row: back button / title / right element */}
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {rightElement ? rightElement : <View style={styles.iconPlaceholder} />}
      </View>

      {/* Optional subtitle — centered below the title, still inside colored zone */}
      {!!subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
    // Inner top-edge light highlight (mostly behind status bar but present on buttons)
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: 4,
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  iconBtn: {
    padding: 8,
    width: 40,
  },
  iconPlaceholder: {
    width: 40,
  },
});
