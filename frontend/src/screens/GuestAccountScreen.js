import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import WarehouseIllustration from '../components/WarehouseIllustration';
import BubblyButton from '../components/BubblyButton';
import PressableBounce from '../components/PressableBounce';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

const EXPLORE_ITEMS = [
  { labelKey: 'viewSuppliers', icon: 'business-outline',           iconBg: '#E6F4FF', iconColor: '#0F766E', screen: 'MarketplaceBrowsing' },
  { labelKey: 'browseBulk',   icon: 'cube-outline',               iconBg: '#F3E8FF', iconColor: '#9333EA', screen: 'MarketplaceBrowsing' },
  { labelKey: 'learnHow',     icon: 'information-circle-outline', iconBg: '#FFF1E6', iconColor: '#F97316', screen: null },
  { labelKey: 'invite',       icon: 'person-add-outline',         iconBg: '#F0FDF4', iconColor: '#22C55E', screen: null },
];

export default function GuestAccountScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, isUrdu, toggleLanguage } = useLanguage();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topBarTitle}>{t.guestAccount.title}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.illustrationWrap}>
          <WarehouseIllustration />
        </View>

        <Text style={styles.message}>{t.guestAccount.message}</Text>

        <BubblyButton
          label={t.guestAccount.signIn}
          onPress={() => navigation.navigate('SavedAccountLogin')}
          variant="primary"
          colors={colors}
          style={styles.signInOverride}
        />

        <PressableBounce
          style={styles.signUpBtn}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signUpBtnText}>{t.guestAccount.createAccount}</Text>
        </PressableBounce>

        {/* Dark mode toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <View style={[styles.toggleIconWrap, { backgroundColor: '#E6F4FF' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={18} color={colors.primary} />
            </View>
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
            <View style={[styles.toggleIconWrap, { backgroundColor: '#E6F4FF' }]}>
              <Ionicons name="globe-outline" size={18} color={colors.primary} />
            </View>
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
          <PressableBounce
            key={i}
            style={styles.exploreRow}
            onPress={() => item.screen ? navigation.navigate(item.screen) : null}
          >
            <View style={[styles.exploreIconWrap, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={18} color={item.iconColor} />
            </View>
            <Text style={styles.exploreText}>{t.guestAccount[item.labelKey]}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </PressableBounce>
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
    paddingBottom: 18,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 14, elevation: 10,
  },
  topBarTitle: { color: '#fff', fontSize: 18, fontFamily: fonts.semiBold },
  scroll: { padding: spacing.md, paddingBottom: 24 },
  illustrationWrap: { alignItems: 'center', marginVertical: spacing.lg },
  message: {
    textAlign: 'center', fontSize: 14, fontFamily: fonts.regular,
    color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg,
  },
  signInOverride: { marginBottom: 12 },
  signUpBtn: {
    backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1.5,
    borderColor: colors.primary, paddingVertical: 14, alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  signUpBtnText: { color: colors.primary, fontSize: 15, fontFamily: fonts.semiBold },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radii.xl,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  exploreLabel: {
    fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 8,
  },
  exploreRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radii.xl,
    padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  exploreIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  exploreText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
});
