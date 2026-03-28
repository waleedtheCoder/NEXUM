import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import WarehouseIllustration from '../components/WarehouseIllustration';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

const EXPLORE_ITEMS = [
  { label: 'View Supplier Network', icon: 'business-outline', screen: 'MarketplaceBrowsing' },
  { label: 'Browse Bulk Products', icon: 'cube-outline', screen: 'MarketplaceBrowsing' },
  { label: 'Learn How NEXUM Works', icon: 'information-circle-outline', screen: null },
  { label: 'Invite Retailers', icon: 'person-add-outline', screen: null },
];

export default function AccountLoggedOutScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topBarTitle}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.illustrationWrap}>
          <WarehouseIllustration />
        </View>

        <Text style={styles.message}>
          Sign in to manage your supplier profile and restock preferences.
        </Text>

        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => navigation.navigate('LoginSignupOption')}
        >
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpBtn}
          onPress={() => navigation.navigate('LoginSignupOption')}
        >
          <Text style={styles.signUpBtnText}>Create an Account</Text>
        </TouchableOpacity>

        <Text style={styles.exploreLabel}>Explore without signing in</Text>
        {EXPLORE_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.exploreRow}
            onPress={() => item.screen ? navigation.navigate(item.screen) : null}
          >
            <View style={styles.exploreIcon}>
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.exploreText}>{item.label}</Text>
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
  exploreLabel: {
    fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
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
