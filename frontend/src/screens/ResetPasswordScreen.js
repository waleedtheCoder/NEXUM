import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import BubblyButton from '../components/BubblyButton';
import { resetPasswordWithBackend } from '../services/authApi';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

function Rule({ valid, text, styles }) {
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
  const { t } = useLanguage();
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
    if (!allValid) { Alert.alert(t.common.error, t.resetPassword.reqsNotMet); return; }
    if (newPass !== confirm) { Alert.alert(t.common.error, t.resetPassword.mismatch); return; }
    if (!email || !otp) {
      Alert.alert(t.common.error, t.resetPassword.sessionExpired);
      navigation.reset({ index: 0, routes: [{ name: 'ForgotPassword' }] });
      return;
    }
    try {
      setLoading(true);
      await resetPasswordWithBackend({
        email: String(email).trim().toLowerCase(),
        otp, newPassword: newPass,
      });
      setLoading(false);
      Alert.alert(t.resetPassword.success, t.resetPassword.successMsg, [
        { text: t.common.confirm, onPress: () => navigation.reset({ index: 1, routes: [{ name: 'MainApp' }, { name: 'Login' }] }) },
      ]);
    } catch (err) {
      setLoading(false);
      Alert.alert(t.resetPassword.failed, err?.message || t.resetPassword.failedMsg);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={t.resetPassword.title} subtitle={t.resetPassword.subtitle} showBack />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>{t.resetPassword.newPassword} *</Text>
        <View style={styles.inputTile}>
          <TextInput
            style={styles.passInput} value={newPass} onChangeText={setNewPass}
            secureTextEntry={!showNew} placeholder={t.resetPassword.newPasswordPlaceholder}
            placeholderTextColor={colors.textLight}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>{t.resetPassword.confirmPassword} *</Text>
        <View style={styles.inputTile}>
          <TextInput
            style={styles.passInput} value={confirm} onChangeText={setConfirm}
            secureTextEntry={!showConfirm} placeholder={t.resetPassword.confirmPlaceholder}
            placeholderTextColor={colors.textLight}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>{t.resetPassword.passwordReqs}</Text>
          <Rule valid={rules.minLength} text={t.resetPassword.req8chars} styles={styles} />
          <Rule valid={rules.hasNumber} text={t.resetPassword.reqNumber} styles={styles} />
          <Rule valid={rules.hasLetter} text={t.resetPassword.reqLetter} styles={styles} />
          <Rule valid={rules.hasSpecial} text={t.resetPassword.reqSpecial} styles={styles} />
        </View>

        <BubblyButton
          label={loading ? t.resetPassword.resetting : t.resetPassword.reset}
          onPress={handleVerify}
          disabled={!allValid || loading}
          loading={loading}
          variant="accent"
          colors={colors}
          style={styles.verifyOverride}
        />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 32 },
  label: { color: colors.primary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 6, marginTop: 14 },
  inputTile: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  passInput: { flex: 1, paddingVertical: 13, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  rulesBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    marginTop: spacing.md,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  rulesTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text, marginBottom: 4 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  valid: { backgroundColor: colors.green },
  invalid: { backgroundColor: '#E5E7EB' },
  ruleText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  ruleTextValid: { color: colors.green },
  verifyOverride: { marginTop: spacing.xl },
});
