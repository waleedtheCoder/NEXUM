import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BubblyButton from '../components/BubblyButton';
import PressableBounce from '../components/PressableBounce';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

export default function AuthOptionsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.topRow}>
        <PressableBounce onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('MainApp')} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.text} />
        </PressableBounce>
      </View>

      <View style={styles.body}>
        <Text style={styles.appName}>NEXUM</Text>
        <Text style={styles.heading}>{t.authOptions.welcomeBack}</Text>

        <BubblyButton
          label={t.authOptions.continueEmail}
          icon={<Ionicons name="mail-outline" size={18} color="#fff" />}
          onPress={() => navigation.navigate('Login')}
          variant="primary"
          colors={colors}
        />

        <PressableBounce
          style={styles.phoneBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Ionicons name="call-outline" size={20} color={colors.primary} />
          <Text style={styles.phoneBtnText}>{t.authOptions.continuePhone}</Text>
        </PressableBounce>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>{t.authOptions.or}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>{t.authOptions.needAccount}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}>{t.authOptions.signUp}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  topRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: spacing.xxl },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  body: { flex: 1, justifyContent: 'center', gap: 12 },
  appName: { fontSize: 32, fontFamily: fonts.bold, color: colors.primary, textAlign: 'center', marginBottom: 4 },
  heading: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  phoneBtn: {
    borderRadius: radii.lg,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  phoneBtnText: { color: colors.primary, fontSize: 15, fontFamily: fonts.semiBold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  signupRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  signupText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary },
  signupLink: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.primary },
});
