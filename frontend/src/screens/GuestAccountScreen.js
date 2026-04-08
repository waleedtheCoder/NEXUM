import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import WarehouseIllustration from '../components/WarehouseIllustration';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

const EXPLORE_ITEMS = [
  { labelKey: 'viewSuppliers', icon: 'business-outline', screen: 'MarketplaceBrowsing' },
  { labelKey: 'browseBulk', icon: 'cube-outline', screen: 'MarketplaceBrowsing' },
  { labelKey: 'learnHow', icon: 'information-circle-outline', screen: null },
  { labelKey: 'invite', icon: 'person-add-outline', screen: null },
];

export default function GuestAccountScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, isUrdu, toggleLanguage } = useLanguage();
  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topBarTitle}>{t.guestAccount.title}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.illustrationWrap}>
          <WarehouseIllustration />
        </View>

        <Text style={styles.message}>{t.guestAccount.message}</Text>

        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => navigation.navigate('SavedAccountLogin')}
        >
          <Text style={styles.signInBtnText}>{t.guestAccount.signIn}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpBtn}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signUpBtnText}>{t.guestAccount.createAccount}</Text>
        </TouchableOpacity>

        {/* Dark mode toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} />
            <Text style={styles.toggleLabel}>{isDark ? t.guestAccount.darkMode : t.guestAccount.lightMode}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={isDark ? colors.primary : colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>

        {/* Language toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
            <Text style={styles.toggleLabel}>{isUrdu ? t.guestAccount.urdu : t.guestAccount.english}</Text>
          </View>
          <Switch
            value={isUrdu}
            onValueChange={toggleLanguage}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={isUrdu ? colors.primary : colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>

        <Text style={styles.exploreLabel}>{t.guestAccount.exploreLabel}</Text>
        {EXPLORE_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.exploreRow}
            onPress={() => item.screen ? navigation.navigate(item.screen) : null}
          >
            <View style={styles.exploreIcon}>
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.exploreText}>{t.guestAccount[item.labelKey]}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <BottomNav activeTab="account" />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    backgroundColor: colors.primary, alignItems: 'center',
    paddingBottom: 14,
  },
  topBarTitle: { color: '#fff', fontSize: 18, fontFamily: fonts.semiBold },
  scroll: { padding: spacing.md, paddingBottom: 24 },
  illustrationWrap: { alignItems: 'center', marginVertical: spacing.lg },
  message: {
    textAlign: 'center', fontSize: 14, fontFamily: fonts.regular,
    color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg,
  },
  signInBtn: {
    backgroundColor: colors.primary, borderRadius: radii.lg,
    paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  signInBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
  signUpBtn: {
    backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1,
    borderColor: colors.primary, paddingVertical: 14, alignItems: 'center', marginBottom: spacing.xl,
  },
  signUpBtnText: { color: colors.primary, fontSize: 15, fontFamily: fonts.semiBold },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: spacing.md,
    paddingVertical: 14, marginBottom: 8, ...shadows.sm,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  exploreLabel: {
    fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 8,
  },
  exploreRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: 14, marginBottom: 8, ...shadows.sm,
  },
  exploreIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  exploreText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
});
