import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../constants/theme';

export default function NoInternetScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="wifi-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.subtitle}>Check your connection and try again.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
