import React from 'react';
import { View, StyleSheet } from 'react-native';

// currentStep is 1-indexed
export default function ProgressIndicator({ totalSteps = 3, currentStep = 1 }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            // FIX: was always `index === 0`. Now correctly tracks the active step.
            index === currentStep - 1 ? styles.wide : styles.small,
            index < currentStep ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  wide: {
    width: 32,
  },
  small: {
    width: 8,
  },
  active: {
    backgroundColor: '#00A859',
  },
  inactive: {
    backgroundColor: '#D1D5DB',
  },
});
