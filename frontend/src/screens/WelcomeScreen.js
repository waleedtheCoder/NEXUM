import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CityIllustration from '../components/CityIllustration';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { t, isUrdu } = useLanguage();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleContinue = async () => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    navigation.navigate('RoleSelection');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.illustrationWrap}>
          <CityIllustration />
        </View>
        <Text style={[styles.appName, isUrdu && styles.urdu]}>{t.welcome.appName}</Text>
        <Text style={[styles.headline, isUrdu && styles.urdu]}>{t.welcome.headline}</Text>
        <Text style={[styles.desc, isUrdu && styles.urdu]}>{t.welcome.description}</Text>
        <View style={styles.instructionBox}>
          <Text style={[styles.instruction, isUrdu && styles.urdu]}>{t.welcome.instruction}</Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleContinue}>
          <Text style={styles.btnText}>{t.welcome.button}</Text>
        </TouchableOpacity>
        <Text style={[styles.footer, isUrdu && styles.urdu]}>{t.welcome.footer}</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: spacing.lg, alignItems: 'center' },
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
