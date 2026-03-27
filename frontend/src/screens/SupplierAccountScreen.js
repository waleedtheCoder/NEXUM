import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import { useUser } from '../context/UserContext';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';

// ── Mock data ────────────────────────────────────────────────────────────────

const RECENT_INQUIRIES = [
  {
    id: 'INQ-001',
    buyer: 'Ahmed General Store',
    product: 'Premium Basmati Rice 25kg',
    message: 'Is bulk discount available for 500kg?',
    time: '10 min ago',
    read: false,
    avatarColor: colors.accent,
    init: 'A',
  },
  {
    id: 'INQ-002',
    buyer: 'Karachi Mart',
    product: 'Cooking Oil 20L',
    message: 'What is the delivery time to Karachi?',
    time: '2 hours ago',
    read: false,
    avatarColor: '#8B5CF6',
    init: 'K',
  },
  {
    id: 'INQ-003',
    buyer: 'Punjab Kirana',
    product: 'Wheat Flour 100kg',
    message: 'Can you do a sample order first?',
    time: 'Yesterday',
    read: true,
    avatarColor: colors.green,
    init: 'P',
  },
];

const PERFORMANCE = [
  { label: 'Active Listings', value: '12', icon: 'cube-outline', color: colors.primary },
  { label: 'Total Inquiries', value: '143', icon: 'chatbubble-outline', color: colors.accent },
  { label: 'Completed Sales', value: '38', icon: 'checkmark-circle-outline', color: colors.green },
  { label: 'Avg. Response', value: '< 1hr', icon: 'time-outline', color: '#8B5CF6' },
];

const MENU_ITEMS = [
  { title: 'My Listings', desc: 'View and manage all your active listings', icon: 'cube-outline', screen: 'MyListings' },
  { title: 'Business Profile', desc: 'Update your business name, location and details', icon: 'business-outline', screen: 'EditProfile' },
  { title: 'Payout & Banking', desc: 'Manage how you receive payments', icon: 'card-outline', screen: null },
  { title: 'Verified Supplier Badge', desc: 'Get verified to build buyer trust', icon: 'shield-checkmark-outline', screen: null, badge: 'New' },
  { title: 'Promote Listings', desc: 'Boost your products to reach more buyers', icon: 'trending-up-outline', screen: null },
  { title: 'Invite Retailers', desc: 'Earn rewards by inviting shopkeepers', icon: 'person-add-outline', screen: null },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function SupplierAccountScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout } = useUser();
  const [inquiries, setInquiries] = useState(RECENT_INQUIRIES);

  const unreadCount = inquiries.filter((i) => !i.read).length;

  const markRead = (id) =>
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));

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

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.topBarIcon}
        >
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Supplier Account</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AppNavigation')}
          style={styles.topBarIcon}
        >
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </Text>
            {/* Verified badge */}
            <View style={styles.verifiedDot}>
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{user?.name || 'Your Business'}</Text>
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedPillText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.profileRole}>Supplier  •  Lahore, PK</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={colors.accent} />
              <Text style={styles.ratingText}>4.8  •  38 completed sales</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Performance stats grid */}
        <Text style={styles.sectionLabel}>Performance</Text>
        <View style={styles.perfGrid}>
          {PERFORMANCE.map((p, i) => (
            <View key={i} style={styles.perfCard}>
              <View style={[styles.perfIconWrap, { backgroundColor: `${p.color}18` }]}>
                <Ionicons name={p.icon} size={20} color={p.color} />
              </View>
              <Text style={styles.perfValue}>{p.value}</Text>
              <Text style={styles.perfLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent inquiries */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Recent Inquiries</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ChatList')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inquiriesCard}>
          {inquiries.map((inq, i) => (
            <TouchableOpacity
              key={inq.id}
              style={[
                styles.inquiryRow,
                i < inquiries.length - 1 && styles.inquiryRowBorder,
                !inq.read && styles.inquiryRowUnread,
              ]}
              onPress={() => {
                markRead(inq.id);
                navigation.navigate('ChatConversation', {
                  chat: {
                    id: inq.id,
                    username: inq.buyer,
                    avatarInitial: inq.init,
                    avatarColor: inq.avatarColor,
                    productTitle: inq.product,
                  },
                });
              }}
            >
              <View style={[styles.inquiryAvatar, { backgroundColor: inq.avatarColor }]}>
                <Text style={styles.inquiryAvatarText}>{inq.init}</Text>
              </View>
              <View style={styles.inquiryContent}>
                <View style={styles.inquiryTopRow}>
                  <Text style={[styles.inquiryBuyer, !inq.read && styles.inquiryBuyerUnread]}>
                    {inq.buyer}
                  </Text>
                  <Text style={styles.inquiryTime}>{inq.time}</Text>
                </View>
                <Text style={styles.inquiryProduct}>{inq.product}</Text>
                <Text style={styles.inquiryMessage} numberOfLines={1}>{inq.message}</Text>
              </View>
              {!inq.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('CategorySelection')}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${colors.accent}18` }]}>
              <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
            </View>
            <Text style={styles.quickLabel}>New Listing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('MyListings')}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="cube-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>My Listings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('ChatList')}
          >
            <View style={[styles.quickIcon, { backgroundColor: `${colors.green}18` }]}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.green} />
            </View>
            <Text style={styles.quickLabel}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => Alert.alert('Analytics', 'Coming soon!')}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#8B5CF618' }]}>
              <Ionicons name="bar-chart-outline" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.quickLabel}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Menu items */}
        <Text style={styles.sectionLabel}>Manage</Text>
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.menuItemText}>
                <View style={styles.menuTitleRow}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  {item.badge && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.menuItemDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

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

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topBar: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
  },
  topBarIcon: { padding: 4, width: 36, position: 'relative' },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontFamily: fonts.bold },

  scroll: { padding: spacing.md, paddingBottom: 24 },

  // Profile
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  profileInitials: { color: '#fff', fontSize: 22, fontFamily: fonts.bold },
  verifiedDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileInfo: { flex: 1 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  profileName: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text },
  verifiedPill: {
    backgroundColor: `${colors.green}20`,
    borderRadius: radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: `${colors.green}50`,
  },
  verifiedPillText: { fontSize: 9, fontFamily: fonts.semiBold, color: colors.green },
  profileRole: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },

  // Section labels
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },

  // Performance grid
  perfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
  },
  perfCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  perfIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfValue: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
  perfLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },

  // Inquiries
  inquiriesCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  inquiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: 12,
  },
  inquiryRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  inquiryRowUnread: { backgroundColor: `${colors.primary}08` },
  inquiryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inquiryAvatarText: { color: '#fff', fontFamily: fonts.semiBold, fontSize: 15 },
  inquiryContent: { flex: 1 },
  inquiryTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  inquiryBuyer: { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  inquiryBuyerUnread: { fontFamily: fonts.semiBold },
  inquiryTime: { fontSize: 10, fontFamily: fonts.regular, color: colors.textLight },
  inquiryProduct: { fontSize: 11, fontFamily: fonts.medium, color: colors.primary, marginBottom: 2 },
  inquiryMessage: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },

  // Quick actions
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    alignItems: 'center',
    gap: 7,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.text, textAlign: 'center' },

  // Menu
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
    paddingVertical: 13,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuItemText: { flex: 1 },
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuItemTitle: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  newBadge: {
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  newBadgeText: { fontSize: 9, fontFamily: fonts.semiBold, color: '#fff' },
  menuItemDesc: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },

  // Logout
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