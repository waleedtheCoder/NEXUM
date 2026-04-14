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
import { getOrders } from '../services/marketplaceApi';

// icon, iconBg: pastel background color for the 44×44 icon container
const getMenuItems = (t) => [
  { titleKey: 'savedListings',    descKey: 'savedListingsDesc',    screen: 'SavedListings',      icon: 'bookmark-outline',   iconBg: '#E6F4FF', iconColor: '#0F766E' },
  { titleKey: 'supplierNetwork',  descKey: 'supplierNetworkDesc',  screen: 'SupplierNetwork',    icon: 'business-outline',   iconBg: '#E6F4FF', iconColor: '#0F766E' },
  { titleKey: 'restockReminders', descKey: 'restockDesc',          screen: 'RestockReminders',   icon: 'alarm-outline',      iconBg: '#F3E8FF', iconColor: '#9333EA', hasNew: true },
  { titleKey: 'bulkDeals',        descKey: 'bulkDealsDesc',        screen: 'MarketplaceBrowsing',icon: 'pricetag-outline',   iconBg: '#FFF1E6', iconColor: '#F97316' },
  { titleKey: 'inviteRetailers',  descKey: 'inviteDesc',           screen: null,                 icon: 'person-add-outline', iconBg: '#E6F4FF', iconColor: '#0F766E' },
];

const STATUS_COLORS = {
  pending:   '#F59E0B',
  confirmed: '#3B82F6',
  shipped:   '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

export default function AccountSettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, isUrdu, toggleLanguage }   = useLanguage();
  const styles     = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { user, logout, role, idToken, sessionId, refreshToken, updateUser } = useUser();
  const isShopkeeper = role === 'SHOPKEEPER' || role === 'shopkeeper' || !role;

  const [orders,        setOrders]        = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError,   setOrdersError]   = useState(null);

  const authArgs = { idToken, sessionId, refreshToken, onTokenRefreshed: (t) => updateUser({ idToken: t }) };

  useFocusEffect(
    useCallback(() => {
      if (!isShopkeeper) return;
      let cancelled = false;
      const fetch = async () => {
        setOrdersLoading(true);
        setOrdersError(null);
        try {
          const data = await getOrders(authArgs);
          if (!cancelled) setOrders(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
          if (!cancelled) setOrdersError(err.message || 'Failed to load orders.');
        } finally {
          if (!cancelled) setOrdersLoading(false);
        }
      };
      fetch();
      return () => { cancelled = true; };
    }, [idToken, sessionId, isShopkeeper])
  );

  const handleLogout = () => {
    Alert.alert(
      t.accountSettings.logOut,
      t.common.logoutConfirm || 'Are you sure you want to log out?',
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.accountSettings.logOut, style: 'destructive', onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
          }
        },
      ]
    );
  };

  const handleMenuPress = (item) => {
    if (item.screen) navigation.navigate(item.screen);
    else Alert.alert(t.accountSettings[item.titleKey], t.common.comingSoon);
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderOrder = (order, i, arr) => {
    const statusKey   = (order.status || '').toLowerCase();
    const statusColor = STATUS_COLORS[statusKey] || colors.textSecondary;
    const statusLabel = order.status
      ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
      : '—';
    return (
      <View key={order.id} style={[styles.orderCard, i < arr.length - 1 && styles.orderCardBorder]}>
        <View style={styles.orderLeft}>
          <View style={styles.orderIconWrap}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderProduct} numberOfLines={1}>{order.productName || '—'}</Text>
            <Text style={styles.orderSupplier}>{order.supplierName || '—'}</Text>
            <Text style={styles.orderDate}>{order.orderDate || '—'}</Text>
          </View>
        </View>
        <View style={styles.orderRight}>
          <Text style={styles.orderAmount}>
            {order.totalPrice ? `Rs ${Number(order.totalPrice).toLocaleString()}` : '—'}
          </Text>
          <View style={[styles.orderStatusBadge, { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}50` }]}>
            <Text style={[styles.orderStatusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ── Mini dashboard header ──────────────────────────────────────── */}
      <View style={[styles.dashHeader, { paddingTop: insets.top + 12 }]}>
        {/* Top row: title + settings icon */}
        <View style={styles.dashTopRow}>
          <Text style={styles.dashTitle}>{t.accountSettings.title}</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('MoreMenu')}
          >
            <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Avatar + name + role */}
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.85}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Your Profile'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {isShopkeeper ? t.accountSettings.shopkeeperAccount : t.accountSettings.supplierAccount}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Translucent stat chips */}
        <View style={styles.statChipsRow}>
          {[
            { label: t.accountSettings.orders,    value: ordersLoading ? '…' : String(orders.length), onPress: () => navigation.navigate('OrderHistory') },
            { label: t.accountSettings.saved,     value: '—', onPress: () => navigation.navigate('SavedListings') },
            { label: t.accountSettings.suppliers, value: '—', onPress: null },
          ].map((chip, i) => (
            <TouchableOpacity
              key={i}
              style={styles.statChip}
              onPress={chip.onPress}
              disabled={!chip.onPress}
              activeOpacity={chip.onPress ? 0.75 : 1}
            >
              <Text style={styles.statChipValue}>{chip.value}</Text>
              <Text style={styles.statChipLabel}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Recent orders (shopkeeper only) */}
        {isShopkeeper && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>{t.accountSettings.recentOrders}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
                <Text style={styles.viewAllText}>{t.accountSettings.viewAll}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {ordersLoading && <View style={styles.center}><ActivityIndicator size="small" color={colors.primary} /></View>}
              {!ordersLoading && ordersError && (
                <View style={styles.center}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.accent} />
                  <Text style={styles.ordersErrorText}>{ordersError}</Text>
                </View>
              )}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <View style={styles.center}>
                  <Ionicons name="receipt-outline" size={28} color={colors.textLight} />
                  <Text style={styles.ordersEmptyText}>{t.accountSettings.noOrders}</Text>
                </View>
              )}
              {!ordersLoading && !ordersError && orders.slice(0, 3).map((o, i, arr) => renderOrder(o, i, arr))}
            </View>
          </View>
        )}

        {/* More on NEXUM — menu list with colored icon containers */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.accountSettings.moreOnNexum}</Text>
          <View style={styles.card}>
            {getMenuItems(t).map((item, i, arr) => (
              <PressableBounce
                key={i}
                style={[styles.menuItem, i < arr.length - 1 && styles.menuItemBorder]}
                onPress={() => handleMenuPress(item)}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: item.iconBg }]}>
                  {item.hasNew && <View style={styles.newDot} />}
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuItemTitle}>{t.accountSettings[item.titleKey]}</Text>
                  <Text style={styles.menuItemDesc}>{t.accountSettings[item.descKey]}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
              </PressableBounce>
            ))}
          </View>
        </View>

        {/* More settings link */}
        <PressableBounce
          style={styles.navCard}
          onPress={() => navigation.navigate('MoreMenu')}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: '#E6F4FF' }]}>
            <Ionicons name="menu" size={20} color={colors.primary} />
          </View>
          <Text style={styles.navCardText}>{t.accountSettings.moreSettings}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </PressableBounce>

        {/* Register as Supplier */}
        <TouchableOpacity
          style={styles.supplierCTA}
          onPress={() => navigation.navigate('ShopkeeperDashboard')}
          activeOpacity={0.85}
        >
          <View style={styles.supplierCTALeft}>
            <View style={[styles.menuIconWrap, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="storefront-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.supplierCTATitle}>{t.accountSettings.registerSupplier}</Text>
              <Text style={styles.supplierCTADesc}>{t.accountSettings.startSelling}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Dark mode toggle */}
        <View style={styles.toggleRow}>
          <View style={[styles.menuIconWrap, { backgroundColor: isDark ? '#1C1C2E' : '#FFF9E6' }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={isDark ? '#818CF8' : '#F59E0B'} />
          </View>
          <Text style={styles.toggleLabel}>{isDark ? t.accountSettings.darkMode : t.accountSettings.lightMode}</Text>
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
          <View style={[styles.menuIconWrap, { backgroundColor: '#E6F4FF' }]}>
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
          </View>
          <Text style={styles.toggleLabel}>{isUrdu ? t.accountSettings.urdu : t.accountSettings.english}</Text>
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
          <Text style={styles.logoutText}>{t.accountSettings.logOut}</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav activeTab="account" />
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // ── Mini dashboard header ──────────────────────────────────────────────────
  dashHeader: {
    backgroundColor: colors.primary,
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
  dashTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dashTitle: { color: '#fff', fontSize: 20, fontFamily: fonts.bold },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile row
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText:   { color: '#fff', fontSize: 20, fontFamily: fonts.bold },
  profileInfo:  { flex: 1 },
  profileName:  { color: '#fff', fontSize: 17, fontFamily: fonts.bold, marginBottom: 2 },
  profileEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: fonts.regular, marginBottom: 6 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleBadgeText: { color: '#fff', fontSize: 11, fontFamily: fonts.medium },

  // Stat chips row
  statChipsRow: { flexDirection: 'row', gap: 10 },
  statChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radii.lg,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statChipValue: { color: '#fff', fontSize: 18, fontFamily: fonts.bold, marginBottom: 2 },
  statChipLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 10, fontFamily: fonts.regular },

  // Content
  scroll: { padding: spacing.md },
  section: { marginBottom: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionLabel: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  viewAllText:  { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },

  // Card container
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },

  // Order cards
  center:          { alignItems: 'center', gap: 6, paddingVertical: 16 },
  ordersErrorText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  ordersEmptyText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary, textAlign: 'center' },
  orderCard:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 12 },
  orderCardBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  orderLeft:       { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  orderIconWrap:   { width: 44, height: 44, borderRadius: 14, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  orderInfo:       { flex: 1 },
  orderProduct:    { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  orderSupplier:   { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  orderDate:       { fontSize: 11, fontFamily: fonts.regular, color: colors.textLight, marginTop: 1 },
  orderRight:      { alignItems: 'flex-end', gap: 4 },
  orderAmount:     { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  orderStatusBadge:{ borderRadius: radii.full, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  orderStatusText: { fontSize: 10, fontFamily: fonts.semiBold },

  // Menu items with colored icon containers
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  newDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    borderWidth: 1.5,
    borderColor: colors.surface,
    zIndex: 1,
  },
  menuText:     { flex: 1 },
  menuItemTitle:{ fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  menuItemDesc: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },

  // Nav card (More Settings)
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  navCardText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },

  // Supplier CTA
  supplierCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}28`,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
    gap: 14,
  },
  supplierCTALeft:  { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  supplierCTATitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  supplierCTADesc:  { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  toggleLabel: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: isDark ? colors.primary : '#FEF2F2',
    borderWidth: 1.5,
    borderColor: isDark ? colors.primaryDark : '#FECACA',
    borderRadius: radii.xl,
    paddingVertical: 15,
    marginTop: 4,
    borderBottomWidth: isDark ? 3 : 1.5,
    borderBottomColor: isDark ? colors.primaryDark : '#FCA5A5',
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)',
  },
  logoutText: { fontSize: 14, fontFamily: fonts.semiBold, color: isDark ? '#000' : '#EF4444' },
});
