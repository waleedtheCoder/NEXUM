import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { fonts } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function FilterChip({ label, active, onPress }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const spring = (toValue) =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => spring(0.9)}
      onPressOut={() => spring(1)}
      activeOpacity={1}
    >
      <Animated.View style={[
        styles.chip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primary : colors.surface,
          // Active chip gets a tinted shadow
          shadowColor: active ? colors.primary : '#000',
          shadowOpacity: active ? 0.25 : 0.06,
          transform: [{ scale }],
        },
      ]}>
        <Text style={[styles.label, { color: active ? '#fff' : colors.textSecondary }]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    marginRight: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    // Inner top-edge highlight baked in via borderTopColor on active state
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 0, // only visible on active (handled above via borderColor)
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
