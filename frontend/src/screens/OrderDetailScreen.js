import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  StatusBar, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';
import { getOrderDetail } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

const STATUS_CONFIG = {
  pending:   { color: '#F59E0B', icon: 'time-outline',             label: 'Pending'   },
  confirmed: { color: '#3B82F6', icon: 'checkmark-circle-outline', label: 'Confirmed' },
  shipped:   { color: '#8B5CF6', icon: 'car-outline',              label: 'Shipped'   },
  delivered: { color: '#00A859', icon: 'bag-check-outline',        label: 'Delivered' },
  cancelled: { color: '#EF4444', icon: 'close-circle-outline',     label: 'Cancelled' },
};

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatusTimeline({ currentStatus }) {
  const isCancelled    = currentStatus === 'cancelled';
  const currentIndex   = STATUS_STEPS.indexOf(currentStatus);

  if (isCancelled) {
    return (
      <View style={styles.cancelledBanner}>
        <Ionicons name="close-circle" size={20} color="#EF4444" />
        <Text style={styles.cancelledText}>This order was cancelled</Text>
      </View>
    );
  }

  return (
    <View style={styles.timeline}>
      {STATUS_STEPS.map((step, i) => {
        const cfg       = STATUS_CONFIG[step];
        const isDone    = i <= currentIndex;
        const isActive  = i === currentIndex;
        const isLast    = i === STATUS_STEPS.length - 1;

        return (
          <View key={step} style={styles.timelineRow}>
            {/* Icon + connector */}
            <View style={styles.timelineLeft}>
              <View style={[
                styles.timelineDot,
                isDone   && { backgroundColor: cfg.color, borderColor: cfg.color },
                isActive && styles.timelineDotActive,
              ]}>
                {isDone
                  ? <Ionicons name={isActive ? cfg.icon : 'checkmark'} size={14} color="#fff" />
                  : <View style={styles.timelineDotInner} />
                }
              </View>
              {!isLast && (
                <View style={[styles.timelineConnector, isDone && i < currentIndex && { backgroundColor: cfg.color }]} />
              )}
            </View>

            {/* Label */}
            <View style={styles.timelineContent}>
              <Text style={[
                styles.timelineLabel,
                isActive && { color: cfg.color, fontFamily: fonts.semiBold },
                !isDone  && { color: colors.textLight },
              ]}>
                {cfg.label}
              </Text>
              {isActive && (
                <Text style={[styles.timelineSub, { color: cfg.color }]}>Current status</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderDetailScreen() {
  const insets  = useSafeAreaInsets();
  const route   = useRoute();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  // Accept either a pre-loaded order object (fast path) or just the id
  const { orderId, order: preloaded } = route.params || {};

  const [order, setOrder]   = useState(preloaded || null);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError]   = useState(null);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  useEffect(() => {
    if (preloaded) return; // already have data
    let cancelled = false;

    const fetch = async () => {
      try {
        const data = await getOrderDetail(orderId, authArgs);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load order.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [orderId]);

  const statusKey = (order?.status || '').toLowerCase();
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;

  if (loading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <ScreenHeader title="Order Details" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <ScreenHeader title="Order Details" showBack />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.accent} />
          <Text style={styles.errorText}>{error || 'Order not found.'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title="Order Details" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Product hero */}
        <View style={styles.hero}>
          {order.imageUrl ? (
            <Image source={{ uri: order.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <Ionicons name="cube-outline" size={40} color={colors.textLight} />
            </View>
          )}
          <View style={styles.heroInfo}>
            <Text style={styles.heroProduct}>{order.productName}</Text>
            <Text style={styles.heroSupplier}>{order.supplierName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusCfg.color}20` }]}>
              <Ionicons name={statusCfg.icon} size={13} color={statusCfg.color} />
              <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Order summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Order ID"       value={`#${order.id}`} />
            <View style={styles.hairline} />
            <InfoRow label="Quantity"       value={`${order.quantity} units`} />
            <View style={styles.hairline} />
            <InfoRow label="Unit Price"     value={`Rs ${Number(order.unitPrice).toLocaleString()}`} />
            <View style={styles.hairline} />
            <InfoRow label="Order Date"     value={order.orderDate} />
            <View style={styles.hairline} />
            <View style={[styles.infoRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs {Number(order.totalPrice).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Status timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.infoCard}>
            <StatusTimeline currentStatus={statusKey} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.lg },
  scroll:    { padding: spacing.md, paddingBottom: 32, gap: 16 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  heroImage: { width: 80, height: 80, borderRadius: radii.lg },
  heroImagePlaceholder: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo:     { flex: 1, gap: 4 },
  heroProduct:  { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text },
  heroSupplier: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  statusBadgeText: { fontSize: 12, fontFamily: fonts.semiBold },

  // ── Sections ──────────────────────────────────────────────────────────────
  section:      { gap: 10 },
  sectionTitle: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  infoValue: { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  hairline:  { height: 1, backgroundColor: colors.border },
  totalRow:  { paddingTop: 14 },
  totalLabel: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text },
  totalValue: { fontSize: 17, fontFamily: fonts.bold, color: colors.primary },

  // ── Status timeline ───────────────────────────────────────────────────────
  timeline: { gap: 0 },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  timelineLeft: { alignItems: 'center', width: 28 },
  timelineDot: {
    width: 28, height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  timelineDotInner:  { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  timelineConnector: {
    width: 2,
    height: 32,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  timelineContent: { flex: 1, paddingTop: 4, paddingBottom: 24 },
  timelineLabel:   { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  timelineSub:     { fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },

  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  cancelledText: { fontSize: 14, fontFamily: fonts.medium, color: '#EF4444' },

  errorText: { fontSize: 14, fontFamily: fonts.medium, color: colors.accent, textAlign: 'center' },
});
