/**
 * ShopkeeperDashboardScreen.js
 *
 * A shopkeeper-mode dashboard accessible by both:
 *   - SUPPLIER users who tap "Switch to Shopkeeper View"
 *   - SHOPKEEPER users who tap "Register as Supplier"
 *
 * Role-based CTA:
 *   SUPPLIER  → "Switch to Supplier Mode" (returns to SupplierAccount)
 *   SHOPKEEPER → "Register as Supplier" (navigates to BecomeSupplier)
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getOrders } from '../services/marketplaceApi';

const STATUS_COLORS = {
  pending:   '#F59E0B',
  confirmed: '#3B82F6',
  shipped:   '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

const MENU_ITEMS = [
  {
    title: 'Browse Marketplace',
    desc:  'Discover products from verified suppliers',
    icon:  'storefront-outline',
    screen: 'MarketplaceBrowsing',
  },
  {
    title: 'My Orders',
    desc:  'View your full purchase history',
    icon:  'receipt-outline',
    screen: 'OrderHistory',
  },
  {
    title: 'Saved Listings',
    desc:  "Products you've saved for later",
    icon:  'bookmark-outline',
    screen: 'SavedListings',
  },
  {
    title: 'Supplier Network',
    desc:  'Manage your trusted suppliers',
    icon:  'people-outline',
    screen: 'SupplierNetwork',
  },
  {
    title: 'Restock Reminders',
    desc:  'Set alerts for frequently ordered products',
    icon:  'notifications-outline',
    screen: 'RestockReminders',
  },
];

export default function ShopkeeperDashboardScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, role, idToken, sessionId, refreshToken, updateUser } = useUser();

  const isSupplier = role === 'SUPPLIER' || role === 'supplier';

  const [orders, setOrders]               = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError]     = useState(null);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  useFocusEffect(
    useCallback(() => {
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
    }, [idToken, sessionId])
  );

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
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
            <Text style={styles.orderSupplier}>{order.supplierName || '—'}</Text>
            <Text style={styles.orderDate}>{order.orderDate || '—'}</Text>
          </View>
        </View>
        <View style={styles.orderRight}>
          <Text style={styles.orderAmount}>
            {order.totalPrice ? `Rs ${Number(order.totalPrice).toLocaleString()}` : '—'}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarBackBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Shopkeeper View</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode banner */}
        {isSupplier ? (
          <TouchableOpacity
            style={styles.modeBannerSupplier}
            onPress={() => navigation.navigate('Account')}
            activeOpacity={0.8}
          >
            <View style={styles.modeBannerLeft}>
              <Ionicons name="swap-horizontal" size={20} color="#fff" />
              <View>
                <Text style={styles.modeBannerTitle}>You're in Shopkeeper Mode</Text>
                <Text style={styles.modeBannerSub}>Tap to switch back to Supplier Mode</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.modeBannerShopkeeper}
            onPress={() => navigation.navigate('BecomeSupplier')}
            activeOpacity={0.8}
          >
            <View style={styles.modeBannerLeft}>
              <Ionicons name="storefront-outline" size={20} color={colors.primary} />
              <View>
                <Text style={styles.modeBannerTitleAlt}>Want to sell on NEXUM?</Text>
                <Text style={styles.modeBannerSubAlt}>Tap to register as a supplier</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Greeting */}
        <View style={styles.greetSection}>
          <Text style={styles.greetText}>Hello, {user?.name || 'Retailer'} 👋</Text>
          <Text style={styles.greetSub}>{user?.email || 'Shopkeeper Dashboard'}</Text>
        </View>

        {/* Profile card */}
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
              {isSupplier ? 'Supplier (Shopkeeper Mode)' : 'Shopkeeper Account'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            {
              label: 'Orders',
              value: ordersLoading ? '…' : String(orders.length),
              icon: 'receipt-outline',
              onPress: () => navigation.navigate('OrderHistory'),
            },
            { label: 'Suppliers', value: '—', icon: 'business-outline' },
            {
              label: 'Saved',
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

        {/* Recent Orders */}
        <View style={styles.ordersSection}>
          <View style={styles.ordersSectionHeader}>
            <Text style={styles.sectionLabel}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
              <Text style={styles.viewAllText}>View All</Text>
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
              <Text style={styles.ordersEmptyText}>No orders yet</Text>
              <Text style={styles.ordersEmptySubText}>Browse the marketplace to place your first order</Text>
            </View>
          )}
          {!ordersLoading && !ordersError && orders.slice(0, 3).map((order, i, arr) =>
            renderOrder(order, i, arr)
          )}
        </View>

        {/* Menu items */}
        <Text style={styles.sectionLabel}>Shopkeeper Tools</Text>
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={isDark ? '#000000' : '#EF4444'} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  topBar:       { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: 14 },
  topBarBackBtn:{ padding: 4, width: 36 },
  topBarTitle:  { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontFamily: fonts.semiBold },
  scroll:       { padding: spacing.md },

  modeBannerSupplier: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary, borderRadius: radii.xl,
    padding: spacing.md, marginBottom: spacing.md,
  },
  modeBannerShopkeeper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: `${colors.primary}12`, borderWidth: 1, borderColor: `${colors.primary}30`,
    borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md,
  },
  modeBannerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  modeBannerTitle:   { fontSize: 13, fontFamily: fonts.semiBold, color: '#fff' },
  modeBannerSub:     { fontSize: 11, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  modeBannerTitleAlt:{ fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  modeBannerSubAlt:  { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },

  greetSection:  { marginBottom: spacing.md },
  greetText:     { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  greetSub:      { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },

  profileCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  profileAvatar:  { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  profileInitials:{ color: '#fff', fontSize: 18, fontFamily: fonts.bold },
  profileInfo:    { flex: 1 },
  profileName:    { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text },
  profileRole:    { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },

  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard:  { flex: 1, backgroundColor: colors.surface, borderRadius: radii.xl, padding: 12, alignItems: 'center', gap: 4, ...shadows.sm },
  statValue: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  statLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },

  sectionLabel:        { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  ordersSection:       { marginBottom: spacing.md },
  ordersSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  viewAllText:         { fontSize: 13, fontFamily: fonts.medium, color: colors.primary },
  ordersCenter:        { alignItems: 'center', gap: 6, paddingVertical: 16 },
  ordersErrorText:     { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  ordersEmptyText:     { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  ordersEmptySubText:  { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },

  orderCard:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: 12 },
  orderCardBorder:  { borderBottomWidth: 1, borderBottomColor: colors.border },
  orderLeft:        { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  orderIconWrap:    { width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  orderInfo:        { flex: 1 },
  orderProduct:     { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  orderSupplier:    { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  orderDate:        { fontSize: 11, fontFamily: fonts.regular, color: colors.textLight, marginTop: 1 },
  orderRight:       { alignItems: 'flex-end', gap: 4 },
  orderAmount:      { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  orderStatusBadge: { borderRadius: radii.full, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  orderStatusText:  { fontSize: 10, fontFamily: fonts.semiBold },

  menuList:      { backgroundColor: colors.surface, borderRadius: radii.xl, marginBottom: spacing.md, ...shadows.sm, overflow: 'hidden' },
  menuItem:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.md, paddingVertical: 14 },
  menuItemBorder:{ borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon:      { width: 36, height: 36, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  menuItemText:  { flex: 1 },
  menuItemTitle: { fontSize: 14, fontFamily: fonts.medium, color: colors.text, marginBottom: 2 },
  menuItemDesc:  { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },

  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: isDark ? colors.primary : '#FEF2F2', borderWidth: 1, borderColor: isDark ? colors.primaryDark : '#FECACA', borderRadius: radii.xl, paddingVertical: 14 },
  logoutText: { fontSize: 14, fontFamily: fonts.semiBold, color: isDark ? '#000000' : '#EF4444' },
});
