import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { radii } from '../constants/theme';

// Single shimmer block
export default function SkeletonLoader({ width, height, borderRadius = radii.md, style }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,    duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.border, opacity }, style]}
    />
  );
}

// Pre-built skeleton for a grid product card
export function SkeletonGridCard({ cardWidth }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,    duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const S = (w, h, r = radii.md) => ({ width: w, height: h, borderRadius: r, backgroundColor: colors.border, marginBottom: 6 });

  return (
    <Animated.View style={{
      flex: 1, backgroundColor: colors.surface, borderRadius: radii.xl,
      overflow: 'hidden', opacity,
      shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.08, shadowRadius: 10, elevation: 5,
    }}>
      {/* Image placeholder */}
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.border }} />
      {/* Info */}
      <View style={{ padding: 10, gap: 6 }}>
        <View style={S('50%', 8, radii.full)} />
        <View style={S('80%', 12, radii.sm)} />
        <View style={S('65%', 10, radii.sm)} />
      </View>
    </Animated.View>
  );
}

// Pre-built skeleton for a list product card
export function SkeletonListCard() {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,    duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{
      flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.xl,
      overflow: 'hidden', marginBottom: 12, height: 100, opacity,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    }}>
      <View style={{ width: 100, height: '100%', backgroundColor: colors.border }} />
      <View style={{ flex: 1, padding: 12, gap: 8, justifyContent: 'center' }}>
        <View style={{ width: '40%', height: 8, borderRadius: radii.full, backgroundColor: colors.border }} />
        <View style={{ width: '70%', height: 14, borderRadius: radii.sm, backgroundColor: colors.border }} />
        <View style={{ width: '55%', height: 10, borderRadius: radii.sm, backgroundColor: colors.border }} />
        <View style={{ width: '45%', height: 8, borderRadius: radii.sm, backgroundColor: colors.border }} />
      </View>
    </Animated.View>
  );
}

// Pre-built skeleton for a horizontal featured card (HomeScreen)
export function SkeletonFeaturedCard() {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,    duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{
      width: 165, backgroundColor: colors.surface, borderRadius: radii.xl,
      overflow: 'hidden', opacity,
      shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.08, shadowRadius: 10, elevation: 5,
    }}>
      <View style={{ width: '100%', height: 105, backgroundColor: colors.border }} />
      <View style={{ padding: 10, gap: 6 }}>
        <View style={{ width: '50%', height: 12, borderRadius: radii.sm, backgroundColor: colors.border }} />
        <View style={{ width: '80%', height: 10, borderRadius: radii.sm, backgroundColor: colors.border }} />
        <View style={{ width: '60%', height: 8, borderRadius: radii.sm, backgroundColor: colors.border }} />
      </View>
    </Animated.View>
  );
}

// Pre-built skeleton for a supplier / generic card row
export function SkeletonCardRow() {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,    duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.surface, borderRadius: radii.xl,
      padding: 16, marginBottom: 10, opacity,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    }}>
      {/* Avatar circle */}
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.border }} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ width: '55%', height: 13, borderRadius: radii.sm, backgroundColor: colors.border }} />
        <View style={{ width: '35%', height: 10, borderRadius: radii.sm, backgroundColor: colors.border }} />
      </View>
    </Animated.View>
  );
}
