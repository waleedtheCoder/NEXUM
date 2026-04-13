import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function NoInternetScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);

  return (
    <View style={styles.container}>

      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobBottomLeft]} />
      <View style={[styles.blob, styles.blobMid]} />

      {/* Content */}
      <View style={styles.content}>

        {/* Wordmark */}
        <Text style={styles.wordmark}>NEXUM</Text>

        {/* Icon bubble */}
        <View style={styles.iconBubble}>
          <View style={styles.iconInner}>
            <Ionicons name="wifi-outline" size={30} color={colors.primary} />
          </View>
        </View>

        {/* Text */}
        <Text style={styles.title}>No connection</Text>
        <Text style={styles.subtitle}>
          Check your Wi-Fi or mobile data{'\n'}and try again.
        </Text>

        {/* Pill hint */}
        <View style={styles.pill}>
          <Ionicons name="reload-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.pillText}>Reconnects automatically</Text>
        </View>

      </View>
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // ── Decorative blobs ─────────────────────────────────────────────────────────
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: isDark ? 0.07 : 0.09,
  },
  blobTopRight: {
    width: 260,
    height: 260,
    backgroundColor: colors.primary,
    top: -80,
    right: -80,
  },
  blobBottomLeft: {
    width: 200,
    height: 200,
    backgroundColor: colors.accent,
    bottom: -60,
    left: -60,
  },
  blobMid: {
    width: 120,
    height: 120,
    backgroundColor: colors.primary,
    top: '55%',
    right: -30,
  },

  // ── Content ──────────────────────────────────────────────────────────────────
  content: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },

  wordmark: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 5,
    color: colors.primary,
    opacity: 0.5,
    marginBottom: 8,
  },

  iconBubble: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: `${colors.primary}20`,
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
});
