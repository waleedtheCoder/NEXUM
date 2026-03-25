import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, spacing, radii } from '../constants/theme';

function PasswordRule({ valid, text }) {
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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const rules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const allValid = Object.values(rules).every(Boolean);

  const handleVerify = () => {
    if (!name || !email || !password || !confirm) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    if (!allValid) { Alert.alert('Error', 'Password does not meet requirements.'); return; }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match.'); return; }
    navigation.navigate('OTPVerification', { email, flow: 'signup' });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title="Create Account" showBack />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={colors.textLight} value={name} onChangeText={setName} />
        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor={colors.textLight} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Text style={styles.label}>Password *</Text>
        <View style={styles.passWrap}>
          <TextInput style={styles.passInput} value={password} onChangeText={setPassword} secureTextEntry={!showPass} placeholder="Create password" placeholderTextColor={colors.textLight} />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}><Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} /></TouchableOpacity>
        </View>
        <Text style={styles.label}>Confirm Password *</Text>
        <View style={styles.passWrap}>
          <TextInput style={styles.passInput} value={confirm} onChangeText={setConfirm} secureTextEntry={!showConfirm} placeholder="Re-enter password" placeholderTextColor={colors.textLight} />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}><Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} /></TouchableOpacity>
        </View>
        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>Password must contain:</Text>
          <PasswordRule valid={rules.minLength} text="At least 8 characters" />
          <PasswordRule valid={rules.hasUpper} text="One uppercase letter" />
          <PasswordRule valid={rules.hasLower} text="One lowercase letter" />
          <PasswordRule valid={rules.hasNumber} text="One number" />
          <PasswordRule valid={rules.hasSpecial} text="One special character" />
        </View>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleVerify}>
          <Text style={styles.ctaBtnText}>Verify with OTP</Text>
        </TouchableOpacity>
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  ctaBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  loginText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary },
  loginLink: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.primary },
});
