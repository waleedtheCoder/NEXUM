import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getOrders } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

const STATUS_CONFIG = {
  pending:   { color: '#F59E0B', bg: '#FEF3C7', label: 'Pending'   },
  confirmed: { color: '#3B82F6', bg: '#DBEAFE', label: 'Confirmed' },
  shipped:   { color: '#8B5CF6', bg: '#EDE9FE', label: 'Shipped'   },
  delivered: { color: '#00A859', bg: '#D1FAE5', label: 'Delivered' },
  cancelled: { color: '#EF4444', bg: '#FEE2E2', label: 'Cancelled' },
};

function OrderCard({ order, onPress }) {
  const statusKey = (order.status || '').toLowerCase();
  const s = STATUS_CONFIG[statusKey] || {
    color: colors.textSecondary,
    bg: colors.border,
    label: order.statusLabel || order.status,
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardImageWrap}>
        {order.imageUrl ? (
          <Image source={{ uri: order.imageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="cube-outline" size={24} color={colors.textLight} />
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.productName} numberOfLines={1}>{order.productName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        <Text style={styles.supplierName}>{order.supplierName}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.orderMeta}>Qty: {order.quantity}</Text>
          <Text style={styles.orderDate}>{order.orderDate}</Text>
          <Text style={styles.totalPrice}>Rs {Number(order.totalPrice).toLocaleString()}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textLight} style={styles.chevron} />
    </TouchableOpacity>
  );
}

export default function OrderHistoryScreen() {
  const { colors } = useTheme();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── Named fetch function — used by both useFocusEffect and the Retry button
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders(authArgs);
      const list = Array.isArray(data) ? data : (data.results || []);
      setOrders(list);
    } catch (err) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [idToken, sessionId]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const renderItem = ({ item }) => (
    <OrderCard
      order={item}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id, order: item })}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="receipt-outline" size={56} color={colors.textLight} />
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptySub}>
        Browse the marketplace and place your first order to see it here.
      </Text>
      <TouchableOpacity
        style={styles.browseBtn}
        onPress={() => navigation.navigate('MarketplaceBrowsing')}
      >
        <Text style={styles.browseBtnText}>Browse Marketplace</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title="My Orders" showBack />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.accent} />
          <Text style={styles.errorText}>{error}</Text>
          {/* FIX: was calling useFocusEffect inside onPress (hooks violation) */}
          <TouchableOpacity style={styles.retryBtn} onPress={loadOrders}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={orders.length === 0 ? styles.flatListEmpty : styles.flatList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.lg },

  flatList:      { padding: spacing.md },
  flatListEmpty: { flex: 1, padding: spacing.md },
  separator:     { height: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardImageWrap: { width: 80, height: 80, flexShrink: 0 },
  cardImage: { width: 80, height: 80 },
  cardImagePlaceholder: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, gap: 4 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  productName: { flex: 1, fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  statusBadge: { borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  statusText:  { fontSize: 10, fontFamily: fonts.semiBold },
  supplierName: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  orderMeta:  { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  orderDate:  { flex: 1, fontSize: 11, fontFamily: fonts.regular, color: colors.textLight },
  totalPrice: { fontSize: 13, fontFamily: fonts.bold, color: colors.primary },
  chevron:    { paddingRight: 12 },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  emptySub:   { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  browseBtn: {
    marginTop: 8, backgroundColor: colors.primary,
    borderRadius: radii.xl, paddingHorizontal: 24, paddingVertical: 12,
  },
  browseBtnText: { color: '#fff', fontFamily: fonts.semiBold, fontSize: 14 },

  errorText: { fontSize: 14, fontFamily: fonts.medium, color: colors.accent, textAlign: 'center' },
  retryBtn:  { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.xl },
  retryText: { color: '#fff', fontFamily: fonts.semiBold, fontSize: 14 },
});