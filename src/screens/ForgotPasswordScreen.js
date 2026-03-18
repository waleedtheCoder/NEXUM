import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, spacing, radii } from '../constants/theme';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');

  const handleReset = () => {
    if (!email) { Alert.alert('Error', 'Please enter your email.'); return; }
    navigation.navigate('OTPVerification', { email, flow: 'reset' });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title="Reset Password" showBack />
      <View style={styles.body}>
        <Text style={styles.message}>Enter your email address to receive a password reset OTP.</Text>
        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} placeholder="your.email@example.com" placeholderTextColor={colors.textLight} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: spacing.lg },
  message: { textAlign: 'center', color: colors.primary, fontSize: 14, fontFamily: fonts.regular, lineHeight: 22, marginBottom: spacing.xl, marginTop: spacing.md },
  label: { color: colors.primary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular, color: colors.text, marginBottom: spacing.xl },
  btnRow: { flexDirection: 'row', gap: 12 },
  backBtn: { flex: 1, borderRadius: radii.md, paddingVertical: 14, backgroundColor: colors.primary, alignItems: 'center' },
  backBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
  resetBtn: { flex: 1, borderRadius: radii.md, paddingVertical: 14, backgroundColor: colors.accent, alignItems: 'center' },
  resetBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
});
