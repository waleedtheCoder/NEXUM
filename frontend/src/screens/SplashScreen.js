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
  const { isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // ✅ You must return the JSX
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.center}>
        <Text style={styles.logo}>NEXUM</Text>
      </View>
      <View style={styles.indicator} />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.splash,
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