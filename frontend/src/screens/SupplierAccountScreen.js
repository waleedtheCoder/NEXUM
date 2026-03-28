import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import { useUser } from '../context/UserContext';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';
import { getSupplierDashboard } from '../services/marketplaceApi';

// Static menu items — navigation only, no API needed
const MENU_ITEMS = [
  { title: 'My Listings',            desc: 'View and manage all your active listings',       icon: 'cube-outline',              screen: 'MyListings'  },
  { title: 'Business Profile',       desc: 'Update your business name, location and details', icon: 'business-outline',          screen: 'EditProfile' },
  { title: 'Payout & Banking',       desc: 'Manage how you receive payments',                 icon: 'card-outline',              screen: null          },
  { title: 'Verified Supplier Badge',desc: 'Get verified to build buyer trust',               icon: 'shield-checkmark-outline',  screen: null, badge: 'New' },
  { title: 'Promote Listings',       desc: 'Boost your products to reach more buyers',        icon: 'trending-up-outline',       screen: null          },
  { title: 'Invite Retailers',       desc: 'Earn rewards by inviting shopkeepers',            icon: 'person-add-outline',        screen: null          },
];

export default function SupplierAccountScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, idToken, sessionId, refreshToken, updateUser } = useUser();

  const [performance, setPerformance] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── Fetch dashboard on focus ──────────────────────────────────────────
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

  // Mark a single inquiry as read (optimistic)
  const markRead = (id) =>
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));

  const unreadCount = inquiries.filter((i) => !i.read).length;

   const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'LoginSelection' }] });
    };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Supplier';
  const initials = displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile header */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.role}>Supplier Account</Text>
            <View style={styles.verifiedRow}>
              <Ionicons name="shield-checkmark" size={14} color={colors.green} />
              <Text style={styles.verifiedText}>Verified Supplier</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editBtn}>
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Performance stats */}
        <Text style={styles.sectionLabel}>Performance Overview</Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : error ? (
          <TouchableOpacity style={styles.errorBanner} onPress={fetchDashboard}>
            <Ionicons name="refresh-outline" size={16} color={colors.accent} />
            <Text style={styles.errorBannerText}>Failed to load — tap to retry</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statsGrid}>
            {performance.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <Ionicons name={stat.icon} size={22} color={stat.color} />
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent inquiries */}
        <View style={styles.inquiriesHeader}>
          <Text style={styles.sectionLabel}>Recent Inquiries</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        {!loading && inquiries.length === 0 && (
          <Text style={styles.emptyInquiries}>No inquiries yet</Text>
        )}

        {inquiries.map((inq) => (
          <TouchableOpacity
            key={inq.id}
            style={[styles.inquiryCard, !inq.read && styles.inquiryCardUnread]}
            onPress={() => {
              markRead(inq.id);
              navigation.navigate('ChatList');
            }}
          >
            <View style={[styles.inqAvatar, { backgroundColor: inq.avatarColor }]}>
              <Text style={styles.inqAvatarText}>{inq.init}</Text>
            </View>
            <View style={styles.inqContent}>
              <View style={styles.inqTopRow}>
                <Text style={styles.inqBuyer}>{inq.buyer}</Text>
                <Text style={styles.inqTime}>{inq.time}</Text>
              </View>
              <Text style={styles.inqProduct}>{inq.product}</Text>
              <Text style={styles.inqMessage} numberOfLines={1}>{inq.message}</Text>
            </View>
            {!inq.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickRow}>
          {[
            { icon: 'add-circle-outline', label: 'New Listing', color: colors.accent,   screen: 'CategorySelection' },
            { icon: 'cube-outline',       label: 'My Listings', color: colors.primary,  screen: 'MyListings'        },
            { icon: 'chatbubble-outline', label: 'Messages',    color: colors.green,    screen: 'ChatList'          },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.quickIcon, { backgroundColor: `${action.color}18` }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuRow, i < MENU_ITEMS.length - 1 && styles.menuRowBorder]}
              onPress={() => item.screen ? navigation.navigate(item.screen) : Alert.alert(item.title, 'Coming soon!')}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              {item.badge && (
                <View style={styles.newBadge}><Text style={styles.newBadgeText}>{item.badge}</Text></View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomNav activeTab="account" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: spacing.md, paddingBottom: 20,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontFamily: fonts.bold, color: '#fff' },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontFamily: fonts.bold, color: colors.text, marginBottom: 2 },
  role: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: 4 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, fontFamily: fonts.medium, color: colors.green },
  editBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  sectionLabel: {
    fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary,
    letterSpacing: 0.6, paddingHorizontal: spacing.md, paddingTop: 20, paddingBottom: 10,
    textTransform: 'uppercase',
  },

  loadingRow: { paddingVertical: 20, alignItems: 'center' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    backgroundColor: `${colors.accent}18`, borderRadius: radii.lg,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: `${colors.accent}40`,
  },
  errorBannerText: { fontSize: 13, fontFamily: fonts.medium, color: colors.accent },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: spacing.md, marginBottom: 4,
  },
  statCard: {
    flex: 1, minWidth: '44%', backgroundColor: colors.surface,
    borderRadius: radii.xl, padding: spacing.md, alignItems: 'center', gap: 6,
    ...shadows.sm,
  },
  statValue: { fontSize: 22, fontFamily: fonts.bold },
  statLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },

  inquiriesHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: 20, paddingBottom: 10,
  },
  unreadBadge: {
    marginLeft: 8, backgroundColor: colors.primary, borderRadius: radii.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontFamily: fonts.semiBold },
  emptyInquiries: {
    fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary,
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
  },

  inquiryCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: spacing.md, marginBottom: 10,
    backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.sm,
    ...shadows.sm,
  },
  inquiryCardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  inqAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  inqAvatarText: { fontSize: 16, fontFamily: fonts.bold, color: '#fff' },
  inqContent: { flex: 1 },
  inqTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  inqBuyer: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },
  inqTime: { fontSize: 11, fontFamily: fonts.regular, color: colors.textLight },
  inqProduct: { fontSize: 11, fontFamily: fonts.medium, color: colors.primary, marginBottom: 3 },
  inqMessage: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4, flexShrink: 0 },

  quickRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: spacing.md, marginBottom: 4,
  },
  quickCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.xl,
    padding: spacing.sm, alignItems: 'center', gap: 8, ...shadows.sm,
  },
  quickIcon: { width: 46, height: 46, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontFamily: fonts.medium, color: colors.text },

  menuSection: { marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radii.xl, ...shadows.sm },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: `${colors.primary}18`, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 14, fontFamily: fonts.medium, color: colors.text, marginBottom: 2 },
  menuDesc: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  newBadge: { backgroundColor: colors.accent, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.semiBold },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: spacing.md, marginTop: 20,
    paddingVertical: 14, borderRadius: radii.xl,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#EF4444' },
});
