import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CityIllustration from '../components/CityIllustration';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState('en');
  const isUrdu = lang === 'ur';

  const content = {
    en: {
      appName: 'NEXUM',
      headline: 'Help us improve your product search experience!',
      description: 'We need your permission to ensure the content we share is relevant and personalized to you.',
      instruction: 'Tap Allow on the next screen to help us personalize your experience.',
      button: 'Continue',
      footer: 'You can always change this preference from your settings later.',
    },
    ur: {
      appName: 'تعلقات',
      headline: 'اپنے پروڈکٹ تلاش کے تجربے کو بہتر بنانے میں ہماری مدد کریں!',
      description: 'ہمیں آپ کی اجازت کی ضرورت ہے تاکہ ہم جو مواد شیئر کرتے ہیں وہ آپ کے لیے متعلقہ ہو۔',
      instruction: 'اپنے تجربے کو ذاتی نوعیت دینے کے لیے اگلی اسکرین پر اجازت دیں پر ٹیپ کریں۔',
      button: 'جاری رکھیں',
      footer: 'آپ بعد میں ترتیبات سے یہ ترجیح تبدیل کر سکتے ہیں۔',
    },
  };

  const t = content[lang];

  const handleContinue = async () => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    navigation.navigate('RoleSelection');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableOpacity
        style={[styles.langBtn, { top: insets.top + 12 }]}
        onPress={() => setLang(isUrdu ? 'en' : 'ur')}
      >
        <Text style={styles.langText}>{isUrdu ? 'English' : 'اردو'}</Text>
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.illustrationWrap}>
          <CityIllustration />
        </View>
        <Text style={[styles.appName, isUrdu && styles.urdu]}>{t.appName}</Text>
        <Text style={[styles.headline, isUrdu && styles.urdu]}>{t.headline}</Text>
        <Text style={[styles.desc, isUrdu && styles.urdu]}>{t.description}</Text>
        <View style={styles.instructionBox}>
          <Text style={[styles.instruction, isUrdu && styles.urdu]}>{t.instruction}</Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleContinue}>
          <Text style={styles.btnText}>{t.button}</Text>
        </TouchableOpacity>
        <Text style={[styles.footer, isUrdu && styles.urdu]}>{t.footer}</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  langBtn: { position: 'absolute', right: 16, zIndex: 10, backgroundColor: colors.primaryLight, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 6 },
  langText: { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },
  scroll: { padding: spacing.lg, paddingTop: 60, alignItems: 'center' },
  illustrationWrap: { marginBottom: spacing.lg },
  appName: { fontSize: 28, fontFamily: fonts.bold, color: colors.primary, marginBottom: 8 },
  headline: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text, textAlign: 'center', marginBottom: 12, lineHeight: 26 },
  desc: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  instructionBox: { backgroundColor: colors.primaryLight, borderRadius: radii.md, padding: 14, marginBottom: spacing.lg, width: '100%' },
  instruction: { fontSize: 13, fontFamily: fonts.regular, color: colors.primary, textAlign: 'center', lineHeight: 20 },
  btn: { backgroundColor: colors.accent, borderRadius: radii.md, paddingVertical: 15, width: '100%', alignItems: 'center', marginBottom: spacing.md },
  btnText: { color: '#fff', fontSize: 16, fontFamily: fonts.semiBold },
  footer: { fontSize: 12, fontFamily: fonts.regular, color: colors.textLight, textAlign: 'center', lineHeight: 18 },
  urdu: { textAlign: 'right', writingDirection: 'rtl' },
});
