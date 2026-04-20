import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import BubblyButton from '../components/BubblyButton';
import { forgotPasswordWithBackend } from '../services/authApi';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { Alert.alert(t.forgotPassword.failed, t.forgotPassword.fillEmail); return; }
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
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={t.forgotPassword.title} subtitle={t.forgotPassword.subtitle} showBack />
      <View style={styles.body}>
        <Text style={styles.hint}>
          Enter the email address associated with your account and we'll send you a verification code.
        </Text>
        <Text style={styles.label}>{t.forgotPassword.email}</Text>
        <View style={styles.inputTile}>
          <TextInput
            style={styles.input}
            placeholder={t.forgotPassword.emailPlaceholder}
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            returnKeyType="done"
            onSubmitEditing={handleReset}
          />
        </View>
        <BubblyButton
          label={loading ? t.forgotPassword.sending : t.forgotPassword.sendOtp}
          onPress={handleReset}
          disabled={loading || !email.trim()}
          loading={loading}
          variant="accent"
          colors={colors}
          style={styles.sendBtn}
        />
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>{t.forgotPassword.back}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.lg },
  hint: {
    fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary,
    lineHeight: 22, marginTop: spacing.md, marginBottom: spacing.xl,
  },
  label: { color: colors.primary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 8 },
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
  input: { paddingVertical: 14, fontSize: 15, fontFamily: fonts.regular, color: colors.text },
  sendBtn: { marginBottom: spacing.lg },
  backLink: { alignItems: 'center', paddingVertical: 10 },
  backLinkText: { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
});
