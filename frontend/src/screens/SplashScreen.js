import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';

export default function SplashScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isLoading, isLoggedIn, role, city, isAdmin } = useUser();

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (isAdmin) {
        navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
        return;
      }
      const isShopkeeper = role === 'shopkeeper' || role === 'SHOPKEEPER';
      if (isLoggedIn && isShopkeeper && !city) {
        navigation.reset({ index: 0, routes: [{ name: 'ShopkeeperCity' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // ✅ You must return the JSX
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.center}>
        <Text style={styles.logo}>NEXUM</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.splash,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center' },
  logo: { color: '#fff', fontSize: 48, fontWeight: '700', letterSpacing: 3 },
});