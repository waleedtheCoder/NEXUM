import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CityIllustration from '../components/CityIllustration';
import BubblyButton from '../components/BubblyButton';
import { fonts, spacing, radii } from '../constants/theme';
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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
        <BubblyButton
          label={t.welcome.button}
          onPress={handleContinue}
          variant="accent"
          colors={colors}
          style={styles.btnOverride}
        />
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
  headline: {
    fontSize: 18, fontFamily: fonts.semiBold, color: colors.text,
    textAlign: 'center', marginBottom: 12, lineHeight: 26,
  },
  desc: {
    fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg,
  },
  instructionBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: spacing.lg,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  instruction: {
    fontSize: 13, fontFamily: fonts.regular, color: colors.primary,
    textAlign: 'center', lineHeight: 20,
  },
  btnOverride: { width: '100%', marginBottom: spacing.md },
  footer: {
    fontSize: 12, fontFamily: fonts.regular, color: colors.textLight,
    textAlign: 'center', lineHeight: 18,
  },
  urdu: { textAlign: 'right', writingDirection: 'rtl' },
});
