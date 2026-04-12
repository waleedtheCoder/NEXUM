import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import BubblyButton from '../components/BubblyButton';
import { useUser } from '../context/UserContext';
import { loginWithBackend, normalizeRoleFromApi } from '../services/authApi';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { t, isUrdu } = useLanguage();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { login, role } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t.common.error, t.login.fillFields);
      return;
    }
    setLoading(true);

    try {
      const response = await loginWithBackend({
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      const userData = response.user || { email };
      const sessionRole = normalizeRoleFromApi(userData.role || role);
      await login(response.session_id, userData, sessionRole, {
        idToken: response.id_token,
        refreshToken: response.refresh_token,
      });

      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    } catch (err) {
      setLoading(false);
      Alert.alert(t.login.failed, err?.message || t.login.failedMsg);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={t.login.title} subtitle={t.login.subtitle} showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t.login.email} *</Text>
        <View style={styles.inputTile}>
          <TextInput
            style={styles.input}
            placeholder={t.login.emailPlaceholder}
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.label}>{t.login.password} *</Text>
        <View style={styles.inputTile}>
          <TextInput
            style={styles.passInput}
            placeholder={t.login.passwordPlaceholder}
            placeholderTextColor={colors.textLight}
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons
              name={showPass ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotWrap}
        >
          <Text style={styles.forgotText}>{t.login.forgotPassword}</Text>
        </TouchableOpacity>

        <BubblyButton
          label={loading ? t.login.signingIn : t.login.signIn}
          onPress={handleLogin}
          disabled={loading}
          loading={loading}
          variant="accent"
          colors={colors}
          style={styles.loginBtnOverride}
        />

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>{t.login.noAccount}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}> {t.login.signUp}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: spacing.md },
  label: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginBottom: 6,
    marginTop: 14,
  },
  inputTile: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  passInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  loginBtnOverride: {
    marginBottom: spacing.md,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
});
