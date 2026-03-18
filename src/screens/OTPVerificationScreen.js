import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { useUser } from '../context/UserContext';
import { colors, fonts, spacing, radii } from '../constants/theme';

export default function OTPVerificationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { login } = useUser();
  const { email = 'user@example.com', flow = 'signup' } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    if (otp.some((d) => !d)) { Alert.alert('Error', 'Please enter all 4 digits.'); return; }
    if (flow === 'reset') {
      navigation.navigate('ResetPassword');
    } else {
      await login('demo_session', { name: 'Demo User', email }, 'shopkeeper');
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    }
  };

  const allFilled = otp.every((d) => d !== '');

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title="Verify Your Email" showBack />
      <View style={styles.body}>
        <Text style={styles.message}>Please enter the 4-digit OTP sent to{'\n'}<Text style={styles.email}>{email}</Text></Text>
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(r) => (inputRefs.current[index] = r)}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(v) => handleChange(index, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </View>
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>Resend in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={() => { setCountdown(60); setOtp(['', '', '', '']); }}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.verifyBtn, !allFilled && styles.verifyBtnDisabled]} onPress={handleVerify} disabled={!allFilled}>
          <Text style={styles.verifyBtnText}>Verify</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.lg, alignItems: 'center' },
  message: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl, marginTop: spacing.md },
  email: { fontFamily: fonts.semiBold, color: colors.primary },
  otpRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  otpBox: { width: 64, height: 64, borderRadius: radii.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, fontSize: 24, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  resendRow: { marginBottom: spacing.xl },
  countdownText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  resendText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.primary },
  verifyBtn: { width: '100%', backgroundColor: colors.accent, borderRadius: radii.md, paddingVertical: 15, alignItems: 'center' },
  verifyBtnDisabled: { opacity: 0.45 },
  verifyBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
});
