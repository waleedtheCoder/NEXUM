import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function NoInternetScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  return (
    <View style={styles.container}>
      <Ionicons name="wifi-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.subtitle}>Check your connection and try again.</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  subtitle: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary },
});
