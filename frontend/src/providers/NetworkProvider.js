import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import NoInternetScreen from '../screens/NoInternetScreen';

export function NetworkProvider({ children }) {
  const isConnected = useNetworkStatus();

  return (
    <View style={styles.container}>
      {children}
      {!isConnected && (
        <View style={StyleSheet.absoluteFillObject}>
          <NoInternetScreen />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
