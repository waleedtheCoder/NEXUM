import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import { loginWithBackend, normalizeRoleFromApi } from '../services/authApi';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function SavedAccountLoginScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation  = useNavigation();
  const insets      = useSafeAreaInsets();
  const { login }   = useUser();

  const [lang, setLang]               = useState('en');
  const [savedEmail, setSavedEmail]   = useState(null);
  const [savedName, setSavedName]     = useState(null);

  // Password prompt state — shown after tapping saved account card
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword]         = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  const isUrdu = lang === 'ur';

  // Load previously saved email/name from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.multiGet(['saved_email', 'saved_name']).then((pairs) => {
      const email = pairs[0][1];
      const name  = pairs[1][1];
      if (email) setSavedEmail(email);
      if (name)  setSavedName(name);
    });
  }, []);

  const displayName = savedName || (savedEmail ? savedEmail.split('@')[0] : null);
  const initial     = displayName ? displayName.charAt(0).toUpperCase() : '?';

  const handleAccountTap = () => {
    setShowPassword(true);
    setError(null);
    setPassword('');
  };

  const handleLogin = async () => {
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await loginWithBackend({
        email: savedEmail,
        password,
        role: null,
      });
      const userData    = response.user || { email: savedEmail };
      const sessionRole = normalizeRoleFromApi(userData.role);
      await login(response.session_id, userData, sessionRole, {
        idToken:      response.id_token,
        refreshToken: response.refresh_token,
      });
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    } catch (err) {
      setError(err?.message || 'Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

        {/* Top row */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.navigate('AuthOptions')}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLang(isUrdu ? 'en' : 'ur')}>
            <Text style={styles.langToggle}>
              <Text style={lang === 'en' ? styles.langActive : styles.langDim}>English</Text>
              {'  |  '}
              <Text style={lang === 'ur' ? styles.langActive : styles.langDim}>اردو</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.appName}>{isUrdu ? 'نیکسم' : 'NEXUM'}</Text>

          {savedEmail ? (
            <>
              <Text style={styles.subtitle}>
                {isUrdu ? 'آپ نے پہلے اس اکاؤنٹ سے لاگ ان کیا ہے' : 'You previously logged in with this account'}
              </Text>

              {/* Saved account card */}
              <TouchableOpacity
                style={[styles.accountCard, showPassword && styles.accountCardActive]}
                onPress={handleAccountTap}
                activeOpacity={0.8}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{displayName}</Text>
                  <Text style={styles.accountEmail}>{savedEmail}</Text>
                </View>
                <Ionicons
                  name={showPassword ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>

              {/* Inline password prompt */}
              {showPassword && (
                <View style={styles.passwordBox}>
                  <Text style={styles.passwordLabel}>
                    {isUrdu ? 'پاس ورڈ درج کریں' : `Enter password for ${savedEmail}`}
                  </Text>

                  <View style={styles.passWrap}>
                    <TextInput
                      style={styles.passInput}
                      placeholder={isUrdu ? 'پاس ورڈ' : 'Password'}
                      placeholderTextColor={colors.textLight}
                      secureTextEntry={!showPass}
                      value={password}
                      onChangeText={(t) => { setPassword(t); setError(null); }}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      <Ionicons
                        name={showPass ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {error && <Text style={styles.errorText}>{error}</Text>}

                  <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.loginBtnText}>{isUrdu ? 'لاگ ان' : 'Sign In'}</Text>
                    }
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                    style={styles.forgotWrap}
                  >
                    <Text style={styles.forgotText}>
                      {isUrdu ? 'پاس ورڈ بھول گئے؟' : 'Forgot password?'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.subtitle}>
              {isUrdu ? 'سائن ان کریں یا نیا اکاؤنٹ بنائیں' : 'Sign in or create a new account to get started'}
            </Text>
          )}

          {/* Use a different account */}
          <TouchableOpacity
            style={styles.differentBtn}
            onPress={() => navigation.navigate('AuthOptions')}
          >
            <View style={styles.plusCircle}>
              <Ionicons name="add" size={22} color="#fff" />
            </View>
            <Text style={styles.differentText}>
              {isUrdu ? 'مختلف اکاؤنٹ استعمال کریں' : 'Use a different account'}
            </Text>
          </TouchableOpacity>

          {/* Sign up link */}
          <TouchableOpacity
            style={styles.signupRow}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signupText}>{isUrdu ? 'نیا اکاؤنٹ بنائیں؟  ' : "Don't have an account?  "}</Text>
            <Text style={styles.signupLink}>{isUrdu ? 'رجسٹر کریں' : 'Sign Up'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  closeBtn:   { fontSize: 18, color: '#fff', padding: 4 },
  langToggle: { fontSize: 14 },
  langActive: { color: '#fff', fontFamily: fonts.semiBold },
  langDim:    { color: 'rgba(255,255,255,0.5)', fontFamily: fonts.regular },

  scroll:   { padding: spacing.lg },
  appName:  { fontSize: 32, fontFamily: fonts.bold, color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xl },

  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 2,
  },
  accountCardActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 22, fontFamily: fonts.bold, color: colors.primary },
  accountInfo:   { flex: 1 },
  accountName:   { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text },
  accountEmail:  { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },

  passwordBox: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    padding: spacing.md,
    paddingTop: 8,
    marginBottom: 12,
    gap: 10,
  },
  passwordLabel: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
  },
  passInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  errorText:        { fontSize: 12, fontFamily: fonts.medium, color: '#EF4444' },
  loginBtn:         { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center' },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText:     { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
  forgotWrap:       { alignItems: 'center' },
  forgotText:       { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },

  differentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.md,
    marginTop: 8,
  },
  plusCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  differentText: { fontSize: 15, fontFamily: fonts.medium, color: '#fff' },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  signupText: { fontSize: 14, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.8)' },
  signupLink: { fontSize: 14, fontFamily: fonts.semiBold, color: '#fff' },
});