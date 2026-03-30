import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import { useUser } from '../context/UserContext';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getSupplierDashboard } from '../services/marketplaceApi';

const MENU_ITEMS = [
  {
    title: 'My Listings',
    desc:  'View and manage all your active listings',
    icon:  'cube-outline',
    screen: 'MyListings',
  },
  {
    title: 'Incoming Orders',
    desc:  'View and manage orders from shopkeepers',
    icon:  'receipt-outline',
    screen: 'IncomingOrders',
    badge: 'New',
  },
  {
    // FIX: was null (coming soon) — EditProfileScreen now exists
    title: 'Business Profile',
    desc:  'Update your business name and details',
    icon:  'business-outline',
    screen: 'EditProfile',
  },
  {
    title: 'Payout & Banking',
    desc:  'Manage how you receive payments',
    icon:  'card-outline',
    screen: null,
  },
  {
    title: 'Verified Supplier Badge',
    desc:  'Get verified to build buyer trust',
    icon:  'shield-checkmark-outline',
    screen: null,
  },
  {
    title: 'Promote Listings',
    desc:  'Boost your products to reach more buyers',
    icon:  'trending-up-outline',
    screen: null,
  },
  {
    title: 'Invite Retailers',
    desc:  'Earn rewards by inviting shopkeepers',
    icon:  'person-add-outline',
    screen: null,
  },
];

export default function SupplierAccountScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, idToken, sessionId, refreshToken, updateUser } = useUser();

  const [performance, setPerformance] = useState([]);
  const [inquiries, setInquiries]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

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

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [idToken, sessionId])
  );

  const markRead = (id) =>
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'SavedAccountLogin' }] });
  };

  const handleMenuPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      Alert.alert(item.title, 'This feature is coming soon!');
    }
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

      {/* Header — FIX: edit pencil now navigates to real EditProfileScreen */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name || 'Supplier'}</Text>
            <Text style={styles.role}>Supplier Account</Text>
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.green} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Performance stats */}
        <Text style={styles.sectionLabel}>Performance</Text>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.accent} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {performance.map((stat, i) => (
              <View key={i} style={[styles.statCard, { borderLeftColor: stat.color || colors.primary }]}>
                <Text style={[styles.statValue, { color: stat.color || colors.primary }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent inquiries */}
        {inquiries.length > 0 && (
          <>
            <View style={styles.inquiriesHeader}>
              <Text style={styles.sectionLabel}>Recent Inquiries</Text>
            </View>
            <View style={styles.menuSection}>
              {inquiries.map((inq, i) => (
                <TouchableOpacity
                  key={inq.id}
                  style={[styles.menuRow, i < inquiries.length - 1 && styles.menuRowBorder]}
                  onPress={() => {
                    markRead(inq.id);
                    // FIX: was inq.conv_id (undefined) — API returns conv ID in inq.id
                    navigation.navigate('ChatConversation', { chat: { id: inq.id } });
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}18` }]}>
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

        {/* Menu items */}
        <Text style={styles.sectionLabel}>Manage</Text>
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuRow, i < MENU_ITEMS.length - 1 && styles.menuRowBorder]}
              onPress={() => handleMenuPress(item)}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              {item.badge && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Switch to Shopkeeper View */}
        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => navigation.navigate('ShopkeeperDashboard')}
          activeOpacity={0.8}
        >
          <View style={styles.themeLeft}>
            <Ionicons name="swap-horizontal-outline" size={20} color={colors.primary} />
            <View>
              <Text style={styles.themeLabel}>Shopkeeper View</Text>
              <Text style={styles.switchSubLabel}>Browse & order from marketplace</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Dark mode toggle */}
        <View style={styles.themeRow}>
          <View style={styles.themeLeft}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny-outline'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.themeLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: `${colors.primary}80` }}
            thumbColor={isDark ? colors.primary : colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={isDark ? '#000000' : '#EF4444'} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      <BottomNav activeTab="account" />
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: 20 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:       { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: '#fff', fontSize: 20, fontFamily: fonts.bold },
  name:         { fontSize: 17, fontFamily: fonts.bold, color: '#fff', marginBottom: 2 },
  role:         { fontSize: 13, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  verifiedRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, fontFamily: fonts.medium, color: colors.green },
  editBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, letterSpacing: 0.6, paddingHorizontal: spacing.md, paddingTop: 20, paddingBottom: 10, textTransform: 'uppercase' },
  loadingRow:      { paddingVertical: 20, alignItems: 'center' },
  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: `${colors.accent}18`, borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: `${colors.accent}40` },
  errorBannerText: { fontSize: 13, fontFamily: fonts.medium, color: colors.accent },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: spacing.md, marginBottom: 4 },
  statCard:     { flex: 1, minWidth: '44%', backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md, alignItems: 'center', gap: 6, ...shadows.sm, borderLeftWidth: 3 },
  statValue:    { fontSize: 22, fontFamily: fonts.bold },
  statLabel:    { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  inquiriesHeader: { flexDirection: 'row', alignItems: 'center' },
  menuSection:  { marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radii.xl, ...shadows.sm, overflow: 'hidden', marginBottom: 4 },
  menuRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.md, paddingVertical: 14 },
  menuRowBorder:{ borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon:     { width: 36, height: 36, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  menuText:     { flex: 1 },
  menuTitle:    { fontSize: 14, fontFamily: fonts.medium, color: colors.text, marginBottom: 2 },
  menuDesc:     { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  newBadge:     { backgroundColor: colors.accent, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4 },
  newBadgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.semiBold },
  switchRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.md, marginTop: 16, marginBottom: 4, backgroundColor: `${colors.primary}12`, borderWidth: 1, borderColor: `${colors.primary}30`, borderRadius: radii.xl, paddingHorizontal: spacing.md, paddingVertical: 14 },
  switchSubLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  themeRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.md, marginTop: 16, marginBottom: 4, backgroundColor: colors.surface, borderRadius: radii.xl, paddingHorizontal: spacing.md, paddingVertical: 14, ...shadows.sm },
  themeLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeLabel: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: spacing.md, marginTop: 12, paddingVertical: 14, borderRadius: radii.xl, backgroundColor: isDark ? colors.primary : 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: isDark ? colors.primaryDark : 'rgba(239,68,68,0.3)' },
  logoutText:   { fontSize: 15, fontFamily: fonts.semiBold, color: isDark ? '#000000' : '#EF4444' },
});