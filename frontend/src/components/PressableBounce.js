import React, { useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';

/**
 * Drop-in replacement for TouchableOpacity that adds an Animated.spring
 * scale-bounce on press. Uses the native driver for 60fps performance.
 *
 * Usage: replace <TouchableOpacity> with <PressableBounce>.
 * The `style` prop goes on the inner Animated.View, not the outer wrapper.
 */
export default function PressableBounce({
  children,
  style,
  onPress,
  onLongPress,
  disabled,
  hitSlop,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const spring = (toValue) =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      tension: 280,
      friction: 10,
    }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => spring(0.93)}
      onPressOut={() => spring(1)}
      disabled={disabled}
      hitSlop={hitSlop}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
