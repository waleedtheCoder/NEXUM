import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { useUser } from '../context/UserContext';
import { signupWithBackend } from '../services/authApi';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

function PasswordRule({ valid, text, styles }) {
  return (
    <View style={styles.ruleRow}>
      <View style={[styles.ruleDot, valid ? styles.ruleDotValid : styles.ruleDotInvalid]}>
        {valid && <Ionicons name="checkmark" size={11} color="#fff" />}
      </View>
      <Text style={[styles.ruleText, valid && styles.ruleTextValid]}>{text}</Text>
    </View>
  );
}

export default function SignUpScreen() {
  const { colors } = useTheme();
  const { t, isUrdu } = useLanguage();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { role } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const rules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const allValid = Object.values(rules).every(Boolean);

  const handleVerify = async () => {
    if (!name || !email || !password || !confirm) { Alert.alert(t.common.error, t.signUp.fillFields); return; }
    if (!allValid) { Alert.alert(t.common.error, t.signUp.reqsNotMet); return; }
    if (password !== confirm) { Alert.alert(t.common.error, t.signUp.mismatch); return; }

    try {
      setLoading(true);
      await signupWithBackend({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      setLoading(false);
      navigation.navigate('OTPVerification', {
        email: email.trim().toLowerCase(),
        flow: 'signup',
        name: name.trim(),
        password,
        role,
      });
    } catch (err) {
      setLoading(false);
      Alert.alert(t.signUp.failed, err?.message || t.signUp.failedMsg);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={t.signUp.title} showBack />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>{t.signUp.fullName} *</Text>
        <TextInput style={styles.input} placeholder={t.signUp.namePlaceholder} placeholderTextColor={colors.textLight} value={name} onChangeText={setName} />
        <Text style={styles.label}>{t.signUp.email} *</Text>
        <TextInput style={styles.input} placeholder={t.signUp.emailPlaceholder} placeholderTextColor={colors.textLight} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Text style={styles.label}>{t.signUp.password} *</Text>
        <View style={styles.passWrap}>
          <TextInput style={styles.passInput} value={password} onChangeText={setPassword} secureTextEntry={!showPass} placeholder={t.signUp.passwordPlaceholder} placeholderTextColor={colors.textLight} />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}><Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} /></TouchableOpacity>
        </View>
        <Text style={styles.label}>{t.signUp.confirmPassword} *</Text>
        <View style={styles.passWrap}>
          <TextInput style={styles.passInput} value={confirm} onChangeText={setConfirm} secureTextEntry={!showConfirm} placeholder={t.signUp.confirmPlaceholder} placeholderTextColor={colors.textLight} />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}><Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} /></TouchableOpacity>
        </View>
        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>{t.signUp.passwordReqs}</Text>
          <PasswordRule valid={rules.minLength} text={t.signUp.req8chars} styles={styles} />
          <PasswordRule valid={rules.hasUpper} text={t.signUp.reqUpper} styles={styles} />
          <PasswordRule valid={rules.hasLower} text={t.signUp.reqLower} styles={styles} />
          <PasswordRule valid={rules.hasNumber} text={t.signUp.reqNumber} styles={styles} />
          <PasswordRule valid={rules.hasSpecial} text={t.signUp.reqSpecial} styles={styles} />
        </View>
        <TouchableOpacity style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]} onPress={handleVerify} disabled={loading}>
          <Text style={styles.ctaBtnText}>{loading ? t.signUp.sendingOtp : t.signUp.verifyOtp}</Text>
        </TouchableOpacity>
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>{t.signUp.alreadyAccount}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> {t.signUp.signIn}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 32 },
  label: { color: colors.primary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14 },
  passInput: { flex: 1, paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  rulesBox: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 14, marginTop: spacing.md, gap: 8 },
  rulesTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text, marginBottom: 4 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ruleDotValid: { backgroundColor: colors.green },
  ruleDotInvalid: { backgroundColor: '#E5E7EB' },
  ruleText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  ruleTextValid: { color: colors.green },
  ctaBtn: { backgroundColor: colors.accent, borderRadius: radii.md, paddingVertical: 15, alignItems: 'center', marginTop: spacing.xl },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  loginText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary },
  loginLink: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.primary },
});
