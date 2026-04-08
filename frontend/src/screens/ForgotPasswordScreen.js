import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { forgotPasswordWithBackend } from '../services/authApi';
import { fonts, spacing, radii, shadows } from '../constants/theme';
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
      <ScreenHeader title={t.forgotPassword.title} showBack />
      <View style={styles.body}>
        <Text style={styles.message}>{t.forgotPassword.subtitle}</Text>
        <Text style={styles.label}>{t.forgotPassword.email}</Text>
        <TextInput style={styles.input} placeholder={t.forgotPassword.emailPlaceholder} placeholderTextColor={colors.textLight} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{t.forgotPassword.back}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.resetBtn, loading && styles.resetBtnDisabled]} onPress={handleReset} disabled={loading}>
            <Text style={styles.resetBtnText}>{loading ? t.forgotPassword.sending : t.forgotPassword.sendOtp}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.lg },
  message: { textAlign: 'center', color: colors.primary, fontSize: 14, fontFamily: fonts.regular, lineHeight: 22, marginBottom: spacing.xl, marginTop: spacing.md },
  label: { color: colors.primary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular, color: colors.text, marginBottom: spacing.xl },
  btnRow: { flexDirection: 'row', gap: 12 },
  backBtn: { flex: 1, borderRadius: radii.md, paddingVertical: 14, backgroundColor: colors.primary, alignItems: 'center' },
  backBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
  resetBtn: { flex: 1, borderRadius: radii.md, paddingVertical: 14, backgroundColor: colors.accent, alignItems: 'center' },
  resetBtnDisabled: { opacity: 0.6 },
  resetBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
});
