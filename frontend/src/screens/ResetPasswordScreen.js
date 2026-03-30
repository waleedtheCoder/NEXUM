import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { resetPasswordWithBackend } from '../services/authApi';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

function Rule({ valid, text }) {
  return (
    <View style={styles.ruleRow}>
      <View style={[styles.ruleDot, valid ? styles.valid : styles.invalid]}>
        {valid && <Ionicons name="checkmark" size={11} color="#fff" />}
      </View>
      <Text style={[styles.ruleText, valid && styles.ruleTextValid]}>{text}</Text>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { email = '', otp = '' } = route.params || {};
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const rules = {
    minLength: newPass.length >= 8,
    hasNumber: /\d/.test(newPass),
    hasLetter: /[a-zA-Z]/.test(newPass),
    hasSpecial: /[@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPass),
  };
  const allValid = Object.values(rules).every(Boolean);

  const handleVerify = async () => {
    if (!allValid) { Alert.alert('Error', 'Password does not meet requirements.'); return; }
    if (newPass !== confirm) { Alert.alert('Error', 'Passwords do not match.'); return; }
    if (!email || !otp) {
      Alert.alert('Error', 'Reset session expired. Please request OTP again.');
      navigation.reset({ index: 0, routes: [{ name: 'ForgotPassword' }] });
      return;
    }

    try {
      setLoading(true);
      await resetPasswordWithBackend({
        email: String(email).trim().toLowerCase(),
        otp,
        newPassword: newPass,
      });
      setLoading(false);
      Alert.alert('Success', 'Password reset successful. Please sign in.', [
        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
      ]);
    } catch (err) {
      setLoading(false);
      Alert.alert('Reset Failed', err?.message || 'Unable to reset password.');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title="Reset Password" showBack />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.message}>
          Your security is our priority. Reset your password to continue managing your wholesale account.
        </Text>

        <Text style={styles.label}>New Password *</Text>
        <View style={styles.passWrap}>
          <TextInput
            style={styles.passInput} value={newPass} onChangeText={setNewPass}
            secureTextEntry={!showNew} placeholder="Enter new password"
            placeholderTextColor={colors.textLight}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password *</Text>
        <View style={styles.passWrap}>
          <TextInput
            style={styles.passInput} value={confirm} onChangeText={setConfirm}
            secureTextEntry={!showConfirm} placeholder="Re-enter new password"
            placeholderTextColor={colors.textLight}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>Password must contain:</Text>
          <Rule valid={rules.minLength} text="At least 8 characters" />
          <Rule valid={rules.hasNumber} text="One number" />
          <Rule valid={rules.hasLetter} text="One letter" />
          <Rule valid={rules.hasSpecial} text="One special character (@, #, $, %, etc.)" />
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, (!allValid || loading) && styles.verifyBtnDisabled]}
          onPress={handleVerify} disabled={!allValid || loading}
        >
          <Text style={styles.verifyBtnText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 32 },
  message: {
    textAlign: 'center', color: colors.primary, fontSize: 13,
    fontFamily: fonts.regular, lineHeight: 20, marginBottom: spacing.lg,
  },
  label: { color: colors.primary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 6, marginTop: 14 },
  passWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, paddingHorizontal: 14, marginBottom: 4,
  },
  passInput: { flex: 1, paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  rulesBox: {
    backgroundColor: colors.surface, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, padding: 14,
    marginTop: spacing.md, gap: 8,
  },
  rulesTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text, marginBottom: 4 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  valid: { backgroundColor: colors.green },
  invalid: { backgroundColor: '#E5E7EB' },
  ruleText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  ruleTextValid: { color: colors.green },
  verifyBtn: {
    backgroundColor: colors.accent, borderRadius: radii.md,
    paddingVertical: 15, alignItems: 'center', marginTop: spacing.xl,
  },
  verifyBtnDisabled: { opacity: 0.45 },
  verifyBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
});
