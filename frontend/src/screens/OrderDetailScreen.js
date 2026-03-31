import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  StatusBar, ActivityIndicator, Image, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getOrderDetail, cancelOrder, createReview } from '../services/marketplaceApi';
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
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const insets  = useSafeAreaInsets();
  const route   = useRoute();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  // Accept either a pre-loaded order object (fast path) or just the id
  const { orderId, order: preloaded } = route.params || {};

  const [order, setOrder]       = useState(preloaded || null);
  const [loading, setLoading]   = useState(!preloaded);
  const [error, setError]       = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

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

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const updated = await cancelOrder(order.id, authArgs);
            setOrder(updated);
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not cancel order.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      await createReview(order.id, { rating: reviewRating, text: reviewText.trim() }, authArgs);
      setReviewSubmitted(true);
      setReviewModalOpen(false);
      Alert.alert('Thank you!', 'Your review has been submitted.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

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

        {/* Cancel button — buyer only, pending orders */}
        {statusKey === 'pending' && (
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling
              ? <ActivityIndicator size="small" color="#EF4444" />
              : <>
                  <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                  <Text style={styles.cancelBtnText}>Cancel Order</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* Review button — delivered orders without a review yet */}
        {statusKey === 'delivered' && !reviewSubmitted && !order.hasReview && (
          <TouchableOpacity style={styles.reviewBtn} onPress={() => setReviewModalOpen(true)}>
            <Ionicons name="star-outline" size={16} color={colors.primary} />
            <Text style={styles.reviewBtnText}>Leave a Review</Text>
          </TouchableOpacity>
        )}
        {(reviewSubmitted || order.hasReview) && statusKey === 'delivered' && (
          <View style={styles.reviewedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.green || '#10B981'} />
            <Text style={styles.reviewedText}>Review submitted</Text>
          </View>
        )}

      </ScrollView>

      {/* Review Modal */}
      <Modal visible={reviewModalOpen} transparent animationType="slide" onRequestClose={() => setReviewModalOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setReviewModalOpen(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rate your experience</Text>
            <TouchableOpacity onPress={() => setReviewModalOpen(false)}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSub}>{order.productName}</Text>

          {/* Star picker */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                <Ionicons
                  name={star <= reviewRating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= reviewRating ? colors.accent : colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.reviewInput}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience (optional)"
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitReviewBtn, submittingReview && { opacity: 0.6 }]}
            onPress={handleSubmitReview}
            disabled={submittingReview}
          >
            {submittingReview
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.submitReviewText}>Submit Review</Text>
            }
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
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

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#EF4444', borderRadius: radii.xl,
    paddingVertical: 13, marginTop: 4,
  },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#EF4444' },

  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.xl,
    paddingVertical: 13, marginTop: 4,
  },
  reviewBtnText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.primary },
  reviewedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, marginTop: 4,
  },
  reviewedText: { fontSize: 13, fontFamily: fonts.medium, color: colors.green || '#10B981' },

  // Review modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle:  { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  modalSub:    { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: spacing.md },
  starRow:     { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.md },
  reviewInput: {
    backgroundColor: colors.background, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: fonts.regular, color: colors.text,
    minHeight: 80, marginBottom: spacing.md,
  },
  submitReviewBtn: {
    backgroundColor: colors.primary, borderRadius: radii.xl,
    paddingVertical: 15, alignItems: 'center',
  },
  submitReviewText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
});
