import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import PressableBounce from '../components/PressableBounce';
import { useUser } from '../context/UserContext';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { getSupplierDashboard } from '../services/marketplaceApi';

// Colored icon containers per item type
const getMenuItems = (t) => [
  { titleKey: 'myListings',     descKey: 'myListingsDesc',      icon: 'cube-outline',             screen: 'Sell',         iconBg: '#E6F4FF', iconColor: '#0F766E' },
  { titleKey: 'incomingOrders', descKey: 'incomingOrdersDesc',  icon: 'receipt-outline',          screen: 'IncomingOrders', iconBg: '#FFF1E6', iconColor: '#F97316', badge: 'New' },
  { titleKey: 'businessProfile',descKey: 'businessProfileDesc', icon: 'business-outline',         screen: 'EditProfile',  iconBg: '#E6F4FF', iconColor: '#0F766E' },
  { titleKey: 'payoutBanking',  descKey: 'payoutDesc',          icon: 'card-outline',             screen: null,           iconBg: '#F0FDF4', iconColor: '#22C55E' },
  { titleKey: 'getVerified',    descKey: 'getVerifiedDesc',     icon: 'shield-checkmark-outline', screen: 'Verification', iconBg: '#F0FDF4', iconColor: '#22C55E' },
  { titleKey: 'promoteListings',descKey: 'promoteDesc',         icon: 'trending-up-outline',      screen: null,           iconBg: '#FFF1E6', iconColor: '#F97316' },
  { titleKey: 'inviteRetailers',descKey: 'inviteDesc',          icon: 'person-add-outline',       screen: null,           iconBg: '#E6F4FF', iconColor: '#0F766E' },
];

export default function SupplierAccountScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, isUrdu, toggleLanguage }   = useLanguage();
  const styles     = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { user, logout, idToken, sessionId, refreshToken, updateUser } = useUser();

  const [performance, setPerformance] = useState([]);
  const [inquiries,   setInquiries]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const authArgs = { idToken, sessionId, refreshToken, onTokenRefreshed: (t) => updateUser({ idToken: t }) };

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSupplierDashboard(authArgs);
      setPerformance(data.performance || []);
      setInquiries(data.recent_inquiries || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboard(); }, [idToken, sessionId]));

  const markRead = (id) => setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));

  const handleLogout = () => {
    Alert.alert(
      t.supplierAccount.logOut,
      t.common.logoutConfirm || 'Are you sure you want to log out?',
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.supplierAccount.logOut, style: 'destructive', onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
          }
        },
      ]
    );
  };

  const handleMenuPress = (item) => {
    if (item.screen) navigation.navigate(item.screen);
    else Alert.alert(t.supplierAccount[item.titleKey], t.common.comingSoon);
  };

  const initials = (user?.name || 'S')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name || 'Supplier'}</Text>
            <Text style={styles.role}>Supplier Account</Text>
            {user?.is_verified && (
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={14} color={colors.green} />
                <Text style={styles.verifiedText}>{t.supplierAccount.verified}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Performance stats */}
        <Text style={styles.sectionLabel}>{t.supplierAccount.performance}</Text>
        {loading ? (
          <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /></View>
        ) : error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.accent} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {performance.map((stat, i) => (
              <View key={i} style={[styles.statCard, { borderLeftColor: stat.color || colors.primary }]}>
                <Text style={[styles.statValue, { color: stat.color || colors.primary }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent inquiries */}
        {inquiries.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t.supplierAccount.recentInquiries}</Text>
            <View style={styles.menuSection}>
              {inquiries.map((inq, i) => (
                <TouchableOpacity
                  key={inq.id}
                  style={[styles.menuRow, i < inquiries.length - 1 && styles.menuRowBorder]}
                  onPress={() => {
                    markRead(inq.id);
                    navigation.navigate('ChatConversation', { chat: { id: inq.id } });
                  }}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: `${colors.primary}18` }]}>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle} numberOfLines={1}>{inq.product}</Text>
                    <Text style={styles.menuDesc} numberOfLines={1}>{inq.buyer} · {inq.time}</Text>
                  </View>
                  {!inq.read && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>New</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Manage menu */}
        <Text style={styles.sectionLabel}>{t.supplierAccount.manage}</Text>
        <View style={styles.menuSection}>
          {getMenuItems(t).map((item, i, arr) => (
            <PressableBounce
              key={i}
              style={[styles.menuRow, i < arr.length - 1 && styles.menuRowBorder]}
              onPress={() => handleMenuPress(item)}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={18} color={item.iconColor} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{t.supplierAccount[item.titleKey]}</Text>
                <Text style={styles.menuDesc}>{t.supplierAccount[item.descKey]}</Text>
              </View>
              {item.badge && (
                <View style={[styles.newBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.newBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </PressableBounce>
          ))}
        </View>

        {/* Switch to Shopkeeper */}
        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => navigation.navigate('ShopkeeperDashboard')}
          activeOpacity={0.85}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{t.supplierAccount.shopkeeperView}</Text>
            <Text style={styles.menuDesc}>{t.supplierAccount.shopkeeperViewDesc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Dark mode */}
        <View style={styles.themeRow}>
          <View style={[styles.menuIconWrap, { backgroundColor: isDark ? '#1C1C2E' : '#FFF9E6' }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={isDark ? '#818CF8' : '#F59E0B'} />
          </View>
          <Text style={styles.themeLabel}>{isDark ? t.supplierAccount.darkMode : t.supplierAccount.lightMode}</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={isDark ? colors.primary : colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>

        {/* Language */}
        <View style={styles.themeRow}>
          <View style={[styles.menuIconWrap, { backgroundColor: '#E6F4FF' }]}>
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.themeLabel}>{isUrdu ? t.supplierAccount.urdu : t.supplierAccount.english}</Text>
          <Switch
            value={isUrdu}
            onValueChange={toggleLanguage}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={isUrdu ? colors.primary : colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={isDark ? '#000' : '#EF4444'} />
          <Text style={styles.logoutText}>{t.supplierAccount.logOut}</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav activeTab="account" />
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 24,
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText:   { color: '#fff', fontSize: 22, fontFamily: fonts.bold },
  name:         { fontSize: 17, fontFamily: fonts.bold, color: '#fff', marginBottom: 2 },
  role:         { fontSize: 12, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  verifiedRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, fontFamily: fonts.medium, color: colors.green },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    paddingHorizontal: spacing.md,
    paddingTop: 20,
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  loadingRow:      { paddingVertical: 20, alignItems: 'center' },
  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: `${colors.accent}18`, borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: `${colors.accent}40` },
  errorBannerText: { fontSize: 13, fontFamily: fonts.medium, color: colors.accent },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: spacing.md, marginBottom: 4 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: { fontSize: 22, fontFamily: fonts.bold },
  statLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },

  menuSection: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  menuRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.md, paddingVertical: 14 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIconWrap:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuText:      { flex: 1 },
  menuTitle:     { fontSize: 14, fontFamily: fonts.medium, color: colors.text, marginBottom: 2 },
  menuDesc:      { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  newBadge:      { backgroundColor: colors.accent, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4 },
  newBadgeText:  { color: '#fff', fontSize: 10, fontFamily: fonts.semiBold },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: spacing.md,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}28`,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: spacing.md,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  themeLabel: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: spacing.md,
    marginTop: 12,
    paddingVertical: 15,
    borderRadius: radii.xl,
    backgroundColor: isDark ? colors.primary : '#FEF2F2',
    borderWidth: 1.5,
    borderColor: isDark ? colors.primaryDark : '#FECACA',
    borderBottomWidth: isDark ? 3 : 1.5,
    borderBottomColor: isDark ? colors.primaryDark : '#FCA5A5',
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)',
  },
  logoutText: { fontSize: 15, fontFamily: fonts.semiBold, color: isDark ? '#000' : '#EF4444' },
});
