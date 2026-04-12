import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import BubblyButton from '../components/BubblyButton';
import PressableBounce from '../components/PressableBounce';
import { forgotPasswordWithBackend } from '../services/authApi';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { t, isUrdu } = useLanguage();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) { Alert.alert(t.forgotPassword.failed, t.forgotPassword.fillEmail); return; }
    try {
      setLoading(true);
      await forgotPasswordWithBackend({ email: email.trim().toLowerCase() });
      setLoading(false);
      navigation.navigate('OTPVerification', { email: email.trim().toLowerCase(), flow: 'reset' });
    } catch (err) {
      setLoading(false);
      Alert.alert(t.forgotPassword.failed, err?.message || t.forgotPassword.failedMsg);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={t.forgotPassword.title} subtitle={t.forgotPassword.subtitle} showBack />
      <View style={styles.body}>
        <Text style={styles.label}>{t.forgotPassword.email}</Text>
        <View style={styles.inputTile}>
          <TextInput
            style={styles.input}
            placeholder={t.forgotPassword.emailPlaceholder}
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.btnRow}>
          <PressableBounce style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{t.forgotPassword.back}</Text>
          </PressableBounce>
          <BubblyButton
            label={loading ? t.forgotPassword.sending : t.forgotPassword.sendOtp}
            onPress={handleReset}
            disabled={loading}
            loading={loading}
            variant="accent"
            colors={colors}
            style={styles.sendBtnOverride}
          />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.lg },
  label: { color: colors.primary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 8, marginTop: spacing.md },
  inputTile: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  input: { paddingVertical: 13, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  btnRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  backBtn: {
    flex: 1, borderRadius: radii.lg, paddingVertical: 14,
    backgroundColor: colors.surface, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  backBtnText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.semiBold },
  sendBtnOverride: { flex: 1 },
});
