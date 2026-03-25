import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';

export default function LogoScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isLoggedIn, isLoading } = useUser();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (isLoading) return;
      const hasSeenOnboarding = await AsyncStorage.getItem('has_seen_onboarding');
      if (isLoggedIn) {
        navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
      } else if (!hasSeenOnboarding) {
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'LoginSignupOption' }] });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoading, isLoggedIn]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.center}>
        <Text style={styles.logo}>NEXUM</Text>
      </View>
      <View style={styles.indicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00A859',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center' },
  logo: { color: '#fff', fontSize: 48, fontWeight: '700', letterSpacing: 3 },
  indicator: {
    width: 128,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginBottom: 8,
  },
});
