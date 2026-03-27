import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fonts, spacing, radii } from '../constants/theme';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

const FILTER_TABS = ['All', 'Unread', 'Inquiries', 'Alerts'];

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── Fetch on focus ──────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications(authArgs);
      setNotifications(data);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [idToken, sessionId])
  );

  // ── Mark single notification read ───────────────────────────────────────
  const handleMarkRead = async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await markNotificationRead(id, authArgs);
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  };

  // ── Mark all read ────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead(authArgs);
    } catch {
      // Revert on failure
      fetchNotifications();
    }
  };

  // ── Client-side tab filter ───────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.read;
    if (activeTab === 'Inquiries') return n.type === 'inquiry';
    if (activeTab === 'Alerts') return n.type === 'price' || n.type === 'restock' || n.type === 'promo';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {tab === 'Unread' && unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.border} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNotifications}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notifRow, !item.read && styles.notifRowUnread]}
              onPress={() => handleMarkRead(item.id)}
              activeOpacity={0.75}
            >
              <View style={[styles.notifIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.notifTime}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={52} color={colors.border} />
              <Text style={styles.emptyText}>No notifications here</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 40 },

  header: {
    backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: 12, gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: fonts.semiBold, color: '#fff', textAlign: 'center' },
  markAllBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  markAllText: { fontSize: 12, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.8)' },

  tabRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  badge: { backgroundColor: colors.accent, borderRadius: radii.full, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: fonts.bold },

  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingHorizontal: spacing.md, paddingVertical: 14, backgroundColor: colors.surface,
  },
  notifRowUnread: { backgroundColor: colors.primaryLight },
  notifIcon: { width: 46, height: 46, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text, marginBottom: 3 },
  notifTitleUnread: { fontFamily: fonts.semiBold },
  notifBody: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 17, marginBottom: 4 },
  notifTime: { fontSize: 11, fontFamily: fonts.regular, color: colors.textLight },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4, flexShrink: 0 },
  separator: { height: 1, backgroundColor: colors.border },
  emptyText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.full },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
});
