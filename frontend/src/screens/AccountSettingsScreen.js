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
import { useLanguage } from '../hooks/useLanguage';
import { getOrders } from '../services/marketplaceApi';

const getMenuItems = (t) => [
  { titleKey: 'savedListings',    descKey: 'savedListingsDesc',    hasNew: false, screen: 'SavedListings'     },
  { titleKey: 'supplierNetwork',  descKey: 'supplierNetworkDesc',  hasNew: false, screen: 'SupplierNetwork'   },
  { titleKey: 'restockReminders', descKey: 'restockDesc',          hasNew: true,  screen: 'RestockReminders'  },
  { titleKey: 'bulkDeals',        descKey: 'bulkDealsDesc',        hasNew: false, screen: 'MarketplaceBrowsing'},
  { titleKey: 'inviteRetailers',  descKey: 'inviteDesc',           hasNew: false, screen: null               },
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
  const { t, isUrdu, toggleLanguage } = useLanguage();
    const styles = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, role, idToken, sessionId, refreshToken, updateUser } = useUser();
  const isShopkeeper = role === 'SHOPKEEPER' || role === 'shopkeeper' || !role;

  const [orders, setOrders]               = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError]     = useState(null);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  useFocusEffect(
    useCallback(() => {
      if (!isShopkeeper) return;
      let cancelled = false;

      const fetchOrders = async () => {
        setOrdersLoading(true);
        setOrdersError(null);
        try {
          const data = await getOrders(authArgs);
          if (!cancelled) {
            const list = Array.isArray(data) ? data : (data.results || []);
            setOrders(list);
          }
        } catch (err) {
          if (!cancelled) setOrdersError(err.message || 'Failed to load orders.');
        } finally {
          if (!cancelled) setOrdersLoading(false);
        }
      };

      fetchOrders();
      return () => { cancelled = true; };
    }, [idToken, sessionId, isShopkeeper])
  );

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
  };

  const handleMenuPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      Alert.alert(t.accountSettings[item.titleKey], t.common.comingSoon);
    }
  };

  const renderOrder = (order, i, arr) => {
    const statusKey   = (order.status || '').toLowerCase();
    const statusColor = STATUS_COLORS[statusKey] || colors.textSecondary;
    const statusLabel = order.status
      ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
      : '—';

    return (
      <View
        key={order.id}
        style={[styles.orderCard, i < arr.length - 1 && styles.orderCardBorder]}
      >
        <View style={styles.orderLeft}>
          <View style={styles.orderIconWrap}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderProduct} numberOfLines={1}>
              {order.productName || '—'}
            </Text>
            <Text style={styles.orderSupplier}>
              {order.supplierName || '—'}
            </Text>
            <Text style={styles.orderDate}>{order.orderDate || '—'}</Text>
          </View>
        </View>
        <View style={styles.orderRight}>
          <Text style={styles.orderAmount}>
            {order.totalPrice
              ? `Rs ${Number(order.totalPrice).toLocaleString()}`
              : '—'}
          </Text>
          <View style={[
            styles.orderStatusBadge,
            { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}50` },
          ]}>
            <Text style={[styles.orderStatusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarIconLeft} />
        <Text style={styles.topBarTitle}>{t.accountSettings.title}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('MoreMenu')}
          style={styles.topBarIconRight}
        >
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetSection}>
          <Text style={styles.greetText}>{t.accountSettings.hello}, {user?.name || t.accountSettings.retailer} 👋</Text>
          <Text style={styles.greetSub}>{user?.email || t.accountSettings.manageAccount}</Text>
        </View>

        {/* Profile card — FIX: now navigates to real EditProfileScreen */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.75}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Your Profile'}</Text>
            <Text style={styles.profileRole}>
              {isShopkeeper ? t.accountSettings.shopkeeperAccount : t.accountSettings.supplierAccount}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            {
              label: t.accountSettings.orders,
              value: ordersLoading ? '…' : String(orders.length),
              icon: 'receipt-outline',
              onPress: () => navigation.navigate('OrderHistory'),
            },
            { label: t.accountSettings.suppliers, value: '—', icon: 'business-outline' },
            {
              label: t.accountSettings.saved,
              value: '—',
              icon: 'bookmark-outline',
              onPress: () => navigation.navigate('SavedListings'),
            },
          ].map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.statCard}
              onPress={s.onPress}
              disabled={!s.onPress}
              activeOpacity={s.onPress ? 0.7 : 1}
            >
              <Ionicons name={s.icon} size={20} color={colors.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders (shopkeeper only) */}
        {isShopkeeper && (
          <View style={styles.ordersSection}>
            <View style={styles.ordersSectionHeader}>
              <Text style={styles.sectionLabel}>{t.accountSettings.recentOrders}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
                <Text style={styles.viewAllText}>{t.accountSettings.viewAll}</Text>
              </TouchableOpacity>
            </View>
            {ordersLoading && (
              <View style={styles.ordersCenter}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
            {!ordersLoading && ordersError && (
              <View style={styles.ordersCenter}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.accent} />
                <Text style={styles.ordersErrorText}>{ordersError}</Text>
              </View>
            )}
            {!ordersLoading && !ordersError && orders.length === 0 && (
              <View style={styles.ordersCenter}>
                <Ionicons name="receipt-outline" size={28} color={colors.textLight} />
                <Text style={styles.ordersEmptyText}>{t.accountSettings.noOrders}</Text>
                <Text style={styles.ordersEmptySubText}>{t.accountSettings.browseOrder}</Text>
              </View>
            )}
            {!ordersLoading && !ordersError && orders.slice(0, 3).map((order, i, arr) =>
              renderOrder(order, i, arr)
            )}
          </View>
        )}

        {/* More on NEXUM */}
        <Text style={styles.sectionLabel}>{t.accountSettings.moreOnNexum}</Text>
        <View style={styles.menuList}>
          {getMenuItems(t).map((item, i, arr) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < arr.length - 1 && styles.menuItemBorder]}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuItemLeft}>
                {item.hasNew && <View style={styles.newDot} />}
                <View style={item.hasNew ? {} : styles.noNewOffset}>
                  <Text style={styles.menuItemTitle}>{t.accountSettings[item.titleKey]}</Text>
                  <Text style={styles.menuItemDesc}>{t.accountSettings[item.descKey]}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation extras */}
        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('MoreMenu')}
        >
          <Ionicons name="menu" size={20} color={colors.primary} />
          <Text style={styles.navCardText}>{t.accountSettings.moreSettings}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Register as Supplier */}
        <TouchableOpacity
          style={styles.supplierCTA}
          onPress={() => navigation.navigate('ShopkeeperDashboard')}
          activeOpacity={0.8}
        >
          <View style={styles.supplierCTALeft}>
            <View style={styles.supplierCTAIcon}>
              <Ionicons name="storefront-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.supplierCTATitle}>{t.accountSettings.registerSupplier}</Text>
              <Text style={styles.supplierCTADesc}>{t.accountSettings.startSelling}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Dark mode toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} />
            <Text style={styles.toggleLabel}>{isDark ? t.accountSettings.darkMode : t.accountSettings.lightMode}</Text>
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
            <Text style={styles.toggleLabel}>{isUrdu ? t.accountSettings.urdu : t.accountSettings.english}</Text>
          </View>
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
          <Ionicons name="log-out-outline" size={18} color={isDark ? '#000000' : '#EF4444'} />
          <Text style={styles.logoutText}>{t.accountSettings.logOut}</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav activeTab="account" />
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  topBar:          { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: 14 },
  topBarIconLeft:  { width: 36 },
  topBarIconRight: { padding: 4, width: 36, alignItems: 'flex-end' },
  topBarTitle:     { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontFamily: fonts.semiBold },
  scroll:          { padding: spacing.md },
  greetSection:    { marginBottom: spacing.md },
  greetText:       { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  greetSub:        { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
  profileCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  profileAvatar:   { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  profileInitials: { color: '#fff', fontSize: 18, fontFamily: fonts.bold },
  profileInfo:     { flex: 1 },
  profileName:     { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text },
  profileRole:     { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
  statsRow:        { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard:        { flex: 1, backgroundColor: colors.surface, borderRadius: radii.xl, padding: 12, alignItems: 'center', gap: 4, ...shadows.sm },
  statValue:       { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  statLabel:       { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  sectionLabel:    { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  ordersSection:       { marginBottom: spacing.md },
  ordersSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  viewAllText:         { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },
  ordersCenter:        { alignItems: 'center', gap: 6, paddingVertical: 16 },
  ordersErrorText:     { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  ordersEmptyText:     { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  ordersEmptySubText:  { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  orderCard:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: 12 },
  orderCardBorder:     { borderBottomWidth: 1, borderBottomColor: colors.border },
  orderLeft:           { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  orderIconWrap:       { width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  orderInfo:           { flex: 1 },
  orderProduct:        { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  orderSupplier:       { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  orderDate:           { fontSize: 11, fontFamily: fonts.regular, color: colors.textLight, marginTop: 1 },
  orderRight:          { alignItems: 'flex-end', gap: 4 },
  orderAmount:         { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  orderStatusBadge:    { borderRadius: radii.full, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  orderStatusText:     { fontSize: 10, fontFamily: fonts.semiBold },
  menuList:        { backgroundColor: colors.surface, borderRadius: radii.xl, marginBottom: spacing.md, ...shadows.sm, overflow: 'hidden' },
  menuItem:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14 },
  menuItemBorder:  { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemLeft:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  newDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  noNewOffset:     { marginLeft: 18 },
  menuItemTitle:   { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  menuItemDesc:    { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  navCard:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  navCardText:     { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  supplierCTA:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${colors.primary}12`, borderWidth: 1, borderColor: `${colors.primary}30`, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md },
  supplierCTALeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supplierCTAIcon:  { width: 38, height: 38, borderRadius: 19, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center' },
  supplierCTATitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  supplierCTADesc:  { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radii.xl, paddingHorizontal: spacing.md, paddingVertical: 14, marginBottom: 8, ...shadows.sm },
  toggleLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  logoutBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: isDark ? colors.primary : '#FEF2F2', borderWidth: 1, borderColor: isDark ? colors.primaryDark : '#FECACA', borderRadius: radii.xl, paddingVertical: 14 },
  logoutText:      { fontSize: 14, fontFamily: fonts.semiBold, color: isDark ? '#000000' : '#EF4444' },
});