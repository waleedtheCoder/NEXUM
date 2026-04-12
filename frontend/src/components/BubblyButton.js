import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fonts } from '../constants/theme';

/**
 * 3D keyboard-key primary button.
 *
 * On pressIn : borderBottomWidth collapses 4 → 1, translateY moves 0 → 3px.
 * On pressOut: both spring back — simulates a physical key being pressed.
 *
 * Props:
 *   label      — button text
 *   icon       — optional React element (e.g. <Ionicons .../>)
 *   onPress    — handler
 *   disabled   — disables interaction
 *   loading    — shows ActivityIndicator in place of label
 *   variant    — 'primary' (teal/rust) | 'accent' (orange)
 *   colors     — colors object from useTheme()
 *   style      — extra style for the animated button view
 *   textStyle  — extra style for the label
 */
export default function BubblyButton({
  label,
  icon,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  colors,
  style,
  textStyle,
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const borderW    = useRef(new Animated.Value(4)).current;

  const bgColor     = variant === 'accent'
    ? (colors?.accent     || '#F97316')
    : (colors?.primary    || '#0F766E');
  const bottomColor = variant === 'accent'
    ? '#C2520A'
    : (colors?.primaryDark || '#0a524d');

  const pressIn = () =>
    Animated.parallel([
      Animated.spring(translateY, { toValue: 3, useNativeDriver: false, tension: 380, friction: 12 }),
      Animated.spring(borderW,    { toValue: 1, useNativeDriver: false, tension: 380, friction: 12 }),
    ]).start();

  const pressOut = () =>
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: false, tension: 260, friction: 9 }),
      Animated.spring(borderW,    { toValue: 4, useNativeDriver: false, tension: 260, friction: 9 }),
    ]).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={style}
    >
      <Animated.View
        style={[
          styles.btn,
          {
            backgroundColor: bgColor,
            borderBottomColor: bottomColor,
            borderBottomWidth: borderW,
            transform: [{ translateY }],
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            {icon ? icon : null}
            {label ? <Text style={[styles.label, textStyle]}>{label}</Text> : null}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 24,
    gap: 8,
    // Inner top-edge highlight — simulates light hitting a convex surface
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
});
