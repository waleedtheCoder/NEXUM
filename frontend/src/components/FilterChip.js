import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { fonts, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function FilterChip({ label, active, onPress }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { borderColor: colors.border, backgroundColor: colors.surface },
        active && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.label, { color: colors.textSecondary }, active && styles.labelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  labelActive: {
    color: '#fff',
  },
});
