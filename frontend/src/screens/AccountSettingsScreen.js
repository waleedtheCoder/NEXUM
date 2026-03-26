// import React from 'react';
// import {
//   View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Alert,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useNavigation } from '@react-navigation/native';
// import BottomNav from '../components/BottomNav';
// import { useUser } from '../context/UserContext';
// import { colors, fonts, spacing, radii, shadows } from '../constants/theme';

// // FIX: all menu items now have onPress handlers
// const MENU_ITEMS = [
//   {
//     title: 'Supplier Network',
//     description: 'Find and connect with verified suppliers',
//     hasNew: false,
//     screen: 'MarketplaceBrowsing',
//   },
//   {
//     title: 'Restock Reminders',
//     description: 'Set alerts for your frequently ordered products',
//     hasNew: true,
//     screen: 'AppNavigation',
//   },
//   {
//     title: 'Bulk Deals & Offers',
//     description: 'Exclusive deals for verified retailers',
//     hasNew: false,
//     screen: 'MarketplaceBrowsing',
//   },
//   {
//     title: 'Invite Retailers',
//     description: 'Earn rewards by inviting other retailers',
//     hasNew: false,
//     screen: null,
//   },
// ];

// export default function AccountSettingsScreen() {
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();
//   const { user, logout } = useUser();

//   const handleLogout = () => {
//     Alert.alert('Log Out', 'Are you sure you want to log out?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Log Out',
//         style: 'destructive',
//         onPress: async () => {
//           await logout();
//           navigation.reset({ index: 0, routes: [{ name: 'LoginSignupOption' }] });
//         },
//       },
//     ]);
//   };

//   const handleMenuPress = (item) => {
//     if (item.screen) {
//       navigation.navigate(item.screen);
//     } else {
//       Alert.alert(item.title, 'This feature is coming soon!');
//     }
//   };

//   return (
//     <View style={[styles.container, { paddingBottom: insets.bottom }]}>
//       <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

//       {/* Top bar */}
//       <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
//         <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.topBarIconLeft}>
//           <Ionicons name="notifications-outline" size={22} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.topBarTitle}>Account</Text>
//         <TouchableOpacity onPress={() => navigation.navigate('AppNavigation')} style={styles.topBarIconRight}>
//           <Ionicons name="settings-outline" size={22} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
//         {/* Greeting */}
//         <View style={styles.greetSection}>
//           <Text style={styles.greetText}>Hello, {user?.name || 'Retailer'} 👋</Text>
//           <Text style={styles.greetSub}>{user?.email || 'Manage your account'}</Text>
//         </View>

//         {/* Profile card */}
//         <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('EditProfile')}>
//           <View style={styles.profileAvatar}>
//             <Text style={styles.profileInitials}>
//               {(user?.name || 'U').charAt(0).toUpperCase()}
//             </Text>
//           </View>
//           <View style={styles.profileInfo}>
//             <Text style={styles.profileName}>{user?.name || 'Your Profile'}</Text>
//             <Text style={styles.profileRole}>Retailer Account</Text>
//           </View>
//           <Ionicons name="chevron-forward" size={18} color={colors.primary} />
//         </TouchableOpacity>

//         {/* Stats row */}
//         <View style={styles.statsRow}>
//           {[
//             { label: 'Orders', value: '24', icon: 'receipt-outline' },
//             { label: 'Suppliers', value: '8', icon: 'business-outline' },
//             { label: 'Saved', value: '15', icon: 'bookmark-outline' },
//           ].map((s, i) => (
//             <View key={i} style={styles.statCard}>
//               <Ionicons name={s.icon} size={20} color={colors.primary} />
//               <Text style={styles.statValue}>{s.value}</Text>
//               <Text style={styles.statLabel}>{s.label}</Text>
//             </View>
//           ))}
//         </View>

//         {/* More on NEXUM — FIX: each item has a real onPress */}
//         <Text style={styles.sectionLabel}>More on NEXUM</Text>
//         <View style={styles.menuList}>
//           {MENU_ITEMS.map((item, i) => (
//             <TouchableOpacity
//               key={i}
//               style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
//               onPress={() => handleMenuPress(item)}
//             >
//               <View style={styles.menuItemLeft}>
//                 {item.hasNew && <View style={styles.newDot} />}
//                 <View style={item.hasNew ? {} : styles.noNewOffset}>
//                   <Text style={styles.menuItemTitle}>{item.title}</Text>
//                   <Text style={styles.menuItemDesc}>{item.description}</Text>
//                 </View>
//               </View>
//               <Ionicons name="chevron-forward" size={18} color={colors.primary} />
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Notification banner */}
//         <View style={styles.notifBanner}>
//           <Ionicons name="notifications-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
//           <View style={styles.notifText}>
//             <Text style={styles.notifTitle}>Stay Updated</Text>
//             <Text style={styles.notifBody}>
//               Enable notifications to get alerts on new supplier leads and restock reminders.
//             </Text>
//           </View>
//         </View>

//         {/* Navigation extras */}
//         <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('AppNavigation')}>
//           <Ionicons name="menu" size={20} color={colors.primary} />
//           <Text style={styles.navCardText}>More Settings & Features</Text>
//           <Ionicons name="chevron-forward" size={18} color={colors.primary} />
//         </TouchableOpacity>

//         {/* Logout */}
//         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
//           <Ionicons name="log-out-outline" size={18} color="#EF4444" />
//           <Text style={styles.logoutText}>Log Out</Text>
//         </TouchableOpacity>
//       </ScrollView>

//       <BottomNav activeTab="account" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: colors.background },
//   topBar: {
//     backgroundColor: colors.primary, flexDirection: 'row',
//     alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: 14,
//   },
//   topBarIconLeft: { padding: 4, width: 36 },
//   topBarIconRight: { padding: 4, width: 36, alignItems: 'flex-end' },
//   topBarTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontFamily: fonts.semiBold },
//   scroll: { padding: spacing.md, paddingBottom: 24 },
//   greetSection: { marginBottom: spacing.md },
//   greetText: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
//   greetSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
//   profileCard: {
//     flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
//     borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm,
//     borderWidth: 1, borderColor: colors.border,
//   },
//   profileAvatar: {
//     width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary,
//     alignItems: 'center', justifyContent: 'center', marginRight: 14,
//   },
//   profileInitials: { color: '#fff', fontSize: 22, fontFamily: fonts.bold },
//   profileInfo: { flex: 1 },
//   profileName: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text },
//   profileRole: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
//   statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
//   statCard: {
//     flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg,
//     padding: 14, alignItems: 'center', gap: 4, ...shadows.sm,
//   },
//   statValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
//   statLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
//   sectionLabel: {
//     fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary,
//     textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
//   },
//   menuList: {
//     backgroundColor: colors.surface, borderRadius: radii.xl,
//     marginBottom: spacing.md, ...shadows.sm, overflow: 'hidden',
//   },
//   menuItem: {
//     flexDirection: 'row', alignItems: 'center',
//     paddingHorizontal: spacing.md, paddingVertical: 14,
//   },
//   menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
//   menuItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
//   newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
//   noNewOffset: { marginLeft: 18 },
//   menuItemTitle: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
//   menuItemDesc: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
//   notifBanner: {
//     flexDirection: 'row', gap: 12, backgroundColor: colors.primaryLight,
//     borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md,
//   },
//   notifText: { flex: 1 },
//   notifTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.primary, marginBottom: 3 },
//   notifBody: { fontSize: 12, fontFamily: fonts.regular, color: colors.text, lineHeight: 18 },
//   navCard: {
//     flexDirection: 'row', alignItems: 'center', gap: 12,
//     backgroundColor: colors.surface, borderRadius: radii.xl,
//     padding: spacing.md, marginBottom: spacing.md, ...shadows.sm,
//   },
//   navCardText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
//   logoutBtn: {
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
//     backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
//     borderRadius: radii.xl, paddingVertical: 14,
//   },
//   logoutText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#EF4444' },
// });

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import { useUser } from '../context/UserContext';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';

const MENU_ITEMS = [
  {
    title: 'Supplier Network',
    description: 'Find and connect with verified suppliers',
    hasNew: false,
    screen: 'MarketplaceBrowsing',
  },
  {
    title: 'Restock Reminders',
    description: 'Set alerts for your frequently ordered products',
    hasNew: true,
    screen: 'AppNavigation',
  },
  {
    title: 'Bulk Deals & Offers',
    description: 'Exclusive deals for verified retailers',
    hasNew: false,
    screen: 'MarketplaceBrowsing',
  },
  {
    title: 'Invite Retailers',
    description: 'Earn rewards by inviting other retailers',
    hasNew: false,
    screen: null,
  },
];

// Mock recent orders for shopkeeper
const RECENT_ORDERS = [
  {
    id: 'ORD-001',
    supplier: 'Bismillah Rice Mills',
    product: 'Basmati Rice 25kg',
    amount: 'Rs 44,000',
    status: 'Delivered',
    date: '2 days ago',
    statusColor: colors.green,
  },
  {
    id: 'ORD-002',
    supplier: 'Punjab Oil Traders',
    product: 'Cooking Oil 20L x5',
    amount: 'Rs 18,500',
    status: 'In Transit',
    date: '4 days ago',
    statusColor: colors.accent,
  },
  {
    id: 'ORD-003',
    supplier: 'Lahore Flour Mills',
    product: 'Wheat Flour 100kg',
    amount: 'Rs 7,500',
    status: 'Processing',
    date: '1 week ago',
    statusColor: '#8B5CF6',
  },
];

export default function AccountSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, role } = useUser();
  const isShopkeeper = role === 'shopkeeper' || !role;

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'LoginSignupOption' }] });
        },
      },
    ]);
  };

  const handleMenuPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      Alert.alert(item.title, 'This feature is coming soon!');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Top bar — no notification bell for shopkeeper */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarIconLeft} />
        <Text style={styles.topBarTitle}>Account</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AppNavigation')}
          style={styles.topBarIconRight}
        >
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greetSection}>
          <Text style={styles.greetText}>Hello, {user?.name || 'Retailer'} 👋</Text>
          <Text style={styles.greetSub}>{user?.email || 'Manage your account'}</Text>
        </View>

        {/* Profile card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Your Profile'}</Text>
            <Text style={styles.profileRole}>
              {isShopkeeper ? 'Shopkeeper Account' : 'Supplier Account'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Orders', value: '24', icon: 'receipt-outline' },
            { label: 'Suppliers', value: '8', icon: 'business-outline' },
            { label: 'Saved', value: '15', icon: 'bookmark-outline' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={s.icon} size={20} color={colors.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── ORDERS SECTION (shopkeeper only) ── */}
        {isShopkeeper && (
          <View style={styles.ordersSection}>
            <View style={styles.ordersSectionHeader}>
              <Text style={styles.sectionLabel}>Recent Orders</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {RECENT_ORDERS.map((order, i) => (
              <View
                key={order.id}
                style={[
                  styles.orderCard,
                  i < RECENT_ORDERS.length - 1 && styles.orderCardBorder,
                ]}
              >
                <View style={styles.orderLeft}>
                  <View style={styles.orderIconWrap}>
                    <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderProduct} numberOfLines={1}>
                      {order.product}
                    </Text>
                    <Text style={styles.orderSupplier}>{order.supplier}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>{order.amount}</Text>
                  <View style={[styles.orderStatusBadge, { backgroundColor: `${order.statusColor}20`, borderColor: `${order.statusColor}50` }]}>
                    <Text style={[styles.orderStatusText, { color: order.statusColor }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* More on NEXUM */}
        <Text style={styles.sectionLabel}>More on NEXUM</Text>
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuItemLeft}>
                {item.hasNew && <View style={styles.newDot} />}
                <View style={item.hasNew ? {} : styles.noNewOffset}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDesc}>{item.description}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation extras */}
        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('AppNavigation')}
        >
          <Ionicons name="menu" size={20} color={colors.primary} />
          <Text style={styles.navCardText}>More Settings & Features</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav activeTab="account" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
  },
  topBarIconLeft: { width: 36 },
  topBarIconRight: { padding: 4, width: 36, alignItems: 'flex-end' },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  scroll: { padding: spacing.md, paddingBottom: 24 },
  greetSection: { marginBottom: spacing.md },
  greetText: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  greetSub: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileInitials: { color: '#fff', fontSize: 22, fontFamily: fonts.bold },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text },
  profileRole: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    ...shadows.sm,
  },
  statValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  statLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },

  // Orders section
  ordersSection: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  ordersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewAllText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    gap: 10,
  },
  orderCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  orderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  orderInfo: { flex: 1 },
  orderProduct: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  orderSupplier: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  orderDate: { fontSize: 10, fontFamily: fonts.regular, color: colors.textLight, marginTop: 1 },
  orderRight: { alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  orderAmount: { fontSize: 13, fontFamily: fonts.bold, color: colors.primary },
  orderStatusBadge: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderStatusText: { fontSize: 10, fontFamily: fonts.semiBold },

  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuList: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  noNewOffset: { marginLeft: 18 },
  menuItemTitle: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  menuItemDesc: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  navCardText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.xl,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#EF4444' },
});