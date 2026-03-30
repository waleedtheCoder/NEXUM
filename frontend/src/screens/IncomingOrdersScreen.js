/**
 * IncomingOrdersScreen.js
 *
 * Supplier's view of all orders placed on their listings.
 * Route name: IncomingOrders
 * Accessible from: SupplierAccountScreen → Incoming Orders menu item
 * APIs:
 *   GET   /api/orders/incoming/  — fetch all incoming orders
 *   PATCH /api/orders/<id>/      — update order status
 *
 * FIX: corrected all field references to match OrderSerializer camelCase output:
 *   order.productName   (was: order.listing_title / order.product_name)
 *   order.buyerName     (was: order.buyer_name / order.buyer?.name — field didn't exist)
 *   order.totalPrice    (was: order.total_price)
 *   order.orderDate     (was: order.created_at_display)
 *   order.unit          (was: order.unit — now returned by updated serializer)
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getIncomingOrders, updateOrderStatus } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmed', color: '#3B82F6', bg: '#DBEAFE' },
  shipped:   { label: 'Shipped',   color: '#8B5CF6', bg: '#EDE9FE' },
  delivered: { label: 'Delivered', color: '#10B981', bg: '#D1FAE5' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' },
};

// Which action buttons appear for each status
const STATUS_ACTIONS = {
  pending:   [
    { label: 'Confirm',      next: 'confirmed', style: 'primary' },
    { label: 'Cancel',       next: 'cancelled', style: 'danger'  },
  ],
  confirmed: [
    { label: 'Mark Shipped', next: 'shipped',   style: 'primary' },
    { label: 'Cancel',       next: 'cancelled', style: 'danger'  },
  ],
  shipped: [
    { label: 'Mark Delivered', next: 'delivered', style: 'primary' },
  ],
  delivered: [],
  cancelled: [],
};

function StatusBadge({ status, colors, styles }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: colors.textSecondary, bg: colors.surface };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function OrderCard({ order, onStatusUpdate, updatingId, colors, styles }) {
  const actions    = STATUS_ACTIONS[order.status] || [];
  const isUpdating = updatingId === order.id;

  return (
    <View style={styles.card}>
      {/* Top row — product + status */}
      <View style={styles.cardTop}>
        <View style={styles.orderIconWrap}>
          <Ionicons name="receipt-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.cardTopInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {order.productName || '—'}
          </Text>
          <Text style={styles.buyerName}>
            from {order.buyerName || 'Buyer'}
          </Text>
        </View>
        <StatusBadge status={order.status} colors={colors} styles={styles} />
      </View>

      {/* Details row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Quantity</Text>
          {/* FIX: order.unit now returned by updated serializer */}
          <Text style={styles.detailValue}>{order.quantity} {order.unit || 'units'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Total</Text>
          {/* FIX: was order.total_price */}
          <Text style={styles.detailValue}>
            Rs {order.totalPrice ? Number(order.totalPrice).toLocaleString() : '—'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Ordered</Text>
          {/* FIX: was order.created_at_display */}
          <Text style={styles.detailValue}>{order.orderDate || '—'}</Text>
        </View>
      </View>

      {/* Notes */}
      {!!order.notes && (
        <Text style={styles.notes} numberOfLines={2}>"{order.notes}"</Text>
      )}

      {/* Action buttons */}
      {actions.length > 0 && (
        <View style={styles.actionsRow}>
          {isUpdating ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 8 }} />
          ) : (
            actions.map((action) => (
              <TouchableOpacity
                key={action.next}
                style={[
                  styles.actionBtn,
                  action.style === 'primary' ? styles.actionBtnPrimary : styles.actionBtnDanger,
                ]}
                onPress={() => onStatusUpdate(order, action.next)}
              >
                <Text style={[
                  styles.actionBtnText,
                  action.style === 'danger' && styles.actionBtnTextDanger,
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function IncomingOrdersScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getIncomingOrders(authArgs);
      const list = Array.isArray(data) ? data : (data.results || []);
      // Newest first — backend orders by -created_at but sort defensively
      setOrders([...list].sort((a, b) => Number(b.id) - Number(a.id)));
    } catch (err) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [idToken, sessionId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders({ silent: true });
  };

  // ── Status update (optimistic) ────────────────────────────────────────────
  const handleStatusUpdate = async (order, newStatus) => {
    setUpdatingId(order.id);
    const prevStatus = order.status;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    );

    try {
      await updateOrderStatus(order.id, newStatus, authArgs);
    } catch (err) {
      // Revert on failure
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: prevStatus } : o))
      );
      Alert.alert('Update Failed', err.message || 'Could not update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const activeCount  = orders.filter((o) => ['confirmed', 'shipped'].includes(o.status)).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Incoming Orders</Text>
          {!loading && orders.length > 0 && (
            <Text style={styles.headerSub}>
              {pendingCount > 0
                ? `${pendingCount} pending action`
                : `${activeCount} in progress`}
            </Text>
          )}
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Order list */}
      {!loading && !error && (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={56} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>
                When shopkeepers order from your listings, they'll appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onStatusUpdate={handleStatusUpdate}
              updatingId={updatingId}
              colors={colors}
              styles={styles}
            />
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.md },

  // Header
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn:     { padding: 4 },
  headerText:  { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: fonts.semiBold, color: '#fff' },
  headerSub:   { fontSize: 12, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // List
  listContent: { padding: spacing.md, paddingBottom: 32, gap: 12 },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  orderIconWrap: {
    width: 38, height: 38, borderRadius: radii.md,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTopInfo:  { flex: 1 },
  productName:  { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 2 },
  buyerName:    { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },

  // Status badge
  badge:     { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontFamily: fonts.semiBold },

  // Details
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: 10,
    marginBottom: 10,
  },
  detailItem:  { flex: 1, alignItems: 'center' },
  detailLabel: { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: 2 },
  detailValue: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text },

  // Notes
  notes: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  // Action buttons
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn:  {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: 9,
    alignItems: 'center',
  },
  actionBtnPrimary: { backgroundColor: colors.primary },
  actionBtnDanger:  { backgroundColor: colors.surface, borderWidth: 1, borderColor: '#EF4444' },
  actionBtnText:     { fontSize: 13, fontFamily: fonts.semiBold, color: '#fff' },
  actionBtnTextDanger: { color: '#EF4444' },

  // Empty state
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, gap: 12,
  },
  emptyTitle:    { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text },
  emptySubtitle: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 24 },

  // Error state
  errorText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  retryBtn:  { backgroundColor: colors.primary, borderRadius: radii.lg, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontFamily: fonts.medium, fontSize: 14 },
});