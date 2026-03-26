import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radii } from '../constants/theme';

export default function LoginSelectionScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState('en');
  const isUrdu = lang === 'ur';
  const savedAccount = { username: 'User 0rv35V', email: 'user@gmail.com' };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
        <Text>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setLang(isUrdu ? 'en' : 'ur')}>
          <Text style={styles.langToggle}>
            <Text style={lang === 'en' ? styles.langActive : styles.langDim}>English</Text>
            {'  |  '}
            <Text style={lang === 'ur' ? styles.langActive : styles.langDim}>اردو</Text>
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.appName}>{isUrdu ? 'تعلقات' : 'NEXUM'}</Text>
        <Text style={styles.subtitle}>{isUrdu ? 'آپ نے پہلے ان اکاؤنٹس سے لاگ ان کیا ہے' : 'You previously logged in with these accounts'}</Text>
        <TouchableOpacity style={styles.accountCard} onPress={() => navigation.navigate('MainApp')}>
          <View style={styles.avatar}><Ionicons name="person" size={28} color={colors.primary} /></View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{savedAccount.username}</Text>
            <Text style={styles.accountEmail}>{savedAccount.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.differentBtn} onPress={() => navigation.navigate('Login')}>
          <View style={styles.plusCircle}><Ionicons name="add" size={22} color="#fff" /></View>
          <Text style={styles.differentText}>{isUrdu ? 'مختلف اکاؤنٹ استعمال کریں' : 'Use a different account'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  langToggle: { fontSize: 14 },
  langActive: { color: '#fff', fontFamily: fonts.semiBold },
  langDim: { color: 'rgba(255,255,255,0.6)', fontFamily: fonts.regular },
  scroll: { padding: spacing.lg },
  appName: { fontSize: 32, fontFamily: fonts.bold, color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xl },
  accountCard: { backgroundColor: '#fff', borderRadius: radii.xl, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text },
  accountEmail: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  differentBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: spacing.md },
  plusCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  differentText: { fontSize: 15, fontFamily: fonts.medium, color: '#fff' },
});
