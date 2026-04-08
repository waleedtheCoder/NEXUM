// frontend/src/components/ScreenHeader.js
//
// The single shared header component used across all non-dark screens.
// Updated to pull colors from useTheme() so it responds to theme switches.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { fonts } from '../constants/theme';

export default function ScreenHeader({ title, showBack = true, rightElement = null }) {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top + 8, backgroundColor: colors.primary },
    ]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
      />
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      <Text style={styles.title}>{title}</Text>

      {rightElement ? rightElement : <View style={styles.iconPlaceholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',          // always white — on colored primary background
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  iconBtn: {
    padding: 8,
    width: 40,
  },
  iconPlaceholder: {
    width: 40,
  },
});