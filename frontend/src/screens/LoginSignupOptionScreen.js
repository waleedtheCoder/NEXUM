import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function LoginSignupOptionScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState('en');
  const isUrdu = lang === 'ur';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf9" />
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setLang(isUrdu ? 'en' : 'ur')}>
          <Text style={styles.langToggle}>
            <Text style={lang === 'en' ? styles.langActive : styles.langInactive}>English</Text>
            {'  |  '}
            <Text style={lang === 'ur' ? styles.langActive : styles.langInactive}>اردو</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.appName}>NEXUM</Text>
        <Text style={styles.heading}>{isUrdu ? 'خوش آمدید' : 'Welcome Back'}</Text>

        <TouchableOpacity style={styles.emailBtn} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="mail-outline" size={20} color="#fff" />
          <Text style={styles.emailBtnText}>{isUrdu ? 'ای میل کے ساتھ جاری رکھیں' : 'Continue with Email'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.phoneBtn} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="call-outline" size={20} color={colors.primary} />
          <Text style={styles.phoneBtnText}>{isUrdu ? 'نمبر کے ساتھ جاری رکھیں' : 'Continue with Number'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>{isUrdu ? 'اکاؤنٹ کی ضرورت ہے؟' : 'Need an account?'}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}>{isUrdu ? 'سائن اپ' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl },
  langToggle: { fontSize: 14 },
  langActive: { color: colors.primary, fontFamily: fonts.semiBold },
  langInactive: { color: colors.textSecondary, fontFamily: fonts.regular },
  body: { flex: 1, justifyContent: 'center', gap: 12 },
  appName: { fontSize: 32, fontFamily: fonts.bold, color: colors.primary, textAlign: 'center', marginBottom: 4 },
  heading: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  emailBtn: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  emailBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
  phoneBtn: { borderRadius: radii.md, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#fff' },
  phoneBtnText: { color: colors.primary, fontSize: 15, fontFamily: fonts.semiBold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  signupRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  signupText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary },
  signupLink: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.primary },
});
