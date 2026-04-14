import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Dimensions, Linking, Alert,
  ActivityIndicator, Modal, TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { getListingDetail, toggleSaveListing, startConversation, placeOrder } from '../services/marketplaceApi';
import { formatPrice } from '../utils/format';
import { useUser } from '../context/UserContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const route      = useRoute();
  const insets     = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, isLoggedIn, updateUser, user } = useUser();

  const stub = route.params?.product;
  const [product, setProduct]           = useState(stub || null);
  const [loading, setLoading]           = useState(!stub?.details);
  const [error, setError]               = useState(null);
  const [saved, setSaved]               = useState(!!stub?.is_saved);
  const [savingInFlight, setSavingInFlight] = useState(false);
  const [chatLoading, setChatLoading]   = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  // ── Order modal state ────────────────────────────────────────────────────
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderQty, setOrderQty]                   = useState('1');
  const [orderNotes, setOrderNotes]               = useState('');
  const [orderLoading, setOrderLoading]           = useState(false);

  // ── Fetch full detail ────────────────────────────────────────────────────
  useEffect(() => {
    if (!stub?.id) return;
    if (stub?.details && stub?.seller && stub?.images) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getListingDetail(stub.id, {
          idToken, sessionId, refreshToken,
          onTokenRefreshed: (t) => updateUser({ idToken: t }),
        });
        if (!cancelled) {
          setProduct(data);
          setSaved(!!data.is_saved);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [stub?.id]);

  // ── Save / unsave ────────────────────────────────────────────────────────
  const handleSaveToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!isLoggedIn) {
      Alert.alert(t.productDetail.signInRequired, t.productDetail.signInToSave, [
        { text: t.productDetail.cancel, style: 'cancel' },
        { text: t.common.signIn, onPress: () => navigation.navigate('SavedAccountLogin') },
      ]);
      return;
    }
    if (savingInFlight) return;
    const willSave = !saved;
    setSaved(willSave);
    setSavingInFlight(true);
    try {
      await toggleSaveListing(product.id, willSave, {
        idToken, sessionId, refreshToken,
        onTokenRefreshed: (t) => updateUser({ idToken: t }),
      });
    } catch {
      setSaved(!willSave);
    } finally {
      setSavingInFlight(false);
    }
  };

  // ── Call Seller ──────────────────────────────────────────────────────────
  const handleCall = () => {
    const phone = product?.seller?.phone || '';
    if (!phone) {
      Alert.alert(t.productDetail.sellerInfo, t.productDetail.phoneNotAvail);
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert(t.productDetail.call, t.productDetail.cantOpenPhone)
    );
  };

  // ── Start Chat ───────────────────────────────────────────────────────────
  const handleChat = async () => {
    if (!isLoggedIn) {
      Alert.alert(t.productDetail.signInRequired, t.productDetail.signInToContact, [
        { text: t.productDetail.cancel, style: 'cancel' },
        { text: t.common.signIn, onPress: () => navigation.navigate('SavedAccountLogin') },
      ]);
      return;
    }
    setChatLoading(true);
    try {
      const result = await startConversation({
        listingId: product.id,
        message: `Assalamu Alaikum! I am interested in "${product.title}". Can you share more details?`,
        idToken, sessionId, refreshToken,
        onTokenRefreshed: (t) => updateUser({ idToken: t }),
      });
      navigation.navigate('ChatConversation', { chat: result.conversation });
    } catch (err) {
      if (err.status === 400 && err.payload?.detail?.includes('own listing')) {
        Alert.alert(t.productDetail.ownListing, t.productDetail.ownListingChat);
      } else {
        Alert.alert(t.productDetail.chat, err.message || t.productDetail.orderFailedMsg);
      }
    } finally {
      setChatLoading(false);
    }
  };

  // ── View Supplier Profile ────────────────────────────────────────────────
  const handleViewSupplier = () => {
    if (!product?.seller?.id) return;
    navigation.navigate('SupplierProfile', { supplierId: product.seller.id });
  };

  // ── Place Order ──────────────────────────────────────────────────────────
  const handleOpenOrder = () => {
    if (!isLoggedIn) {
      Alert.alert(t.productDetail.signInRequired, t.productDetail.signInToContact, [
        { text: t.productDetail.cancel, style: 'cancel' },
        { text: t.common.signIn, onPress: () => navigation.navigate('SavedAccountLogin') },
      ]);
      return;
    }
    if (product?.seller?.id && user?.id && product.seller.id === user.id) {
      Alert.alert(t.productDetail.ownListing, t.productDetail.ownListingOrder);
      return;
    }
    setOrderQty('1');
    setOrderNotes('');
    setOrderModalVisible(true);
  };

  const handlePlaceOrder = async () => {
    const qty = parseInt(orderQty, 10);
    if (!qty || qty < 1) {
      Alert.alert(t.productDetail.invalidQty, t.productDetail.minQty);
      return;
    }
    setOrderLoading(true);
    try {
      await placeOrder(
        { listing_id: product.id, quantity: qty, notes: orderNotes.trim() },
        { idToken, sessionId, refreshToken, onTokenRefreshed: (t) => updateUser({ idToken: t }) },
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setOrderModalVisible(false);
      Alert.alert(
        t.productDetail.orderPlaced,
        t.productDetail.orderSent,
        [
          { text: t.productDetail.viewOrders, onPress: () => navigation.navigate('OrderHistory') },
          { text: t.common.confirm },
        ],
      );
    } catch (err) {
      if (err.status === 400 && err.payload?.detail?.includes('own listing')) {
        Alert.alert(t.productDetail.ownListing, t.productDetail.ownListingOrder);
      } else {
        Alert.alert(t.productDetail.orderFailed, err.message || t.productDetail.orderFailedMsg);
      }
    } finally {
      setOrderLoading(false);
    }
  };

  // ── Loading / Error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="cloud-offline-outline" size={52} color="#374151" />
        <Text style={styles.errorText}>{error || t.productDetail.notFound}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
          <Text style={styles.retryText}>{t.productDetail.goBack}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images?.length ? product.images : [product.imageUrl].filter(Boolean);

  // Promotion info (if any active promo on this listing)
  const promo        = product.promotion || null;
  const displayPrice = promo ? promo.discountedPrice : product.price;

  // Live total price for the modal (use discounted price if promo active)
  const modalTotal = displayPrice && parseInt(orderQty, 10)
    ? (parseFloat(displayPrice) * parseInt(orderQty, 10)).toLocaleString()
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Image carousel ─────────────────────────────────────────────── */}
      <View style={styles.imageContainer}>
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImage(idx);
            }}
          >
            {images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.productImage} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.productImage, styles.noImage]}>
            <Ionicons name="image-outline" size={64} color={colors.textLight} />
          </View>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToggle}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? colors.accent : '#fff'} />
        </TouchableOpacity>

        {images.length > 1 && (
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentImage && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Price + title */}
        <View style={styles.card}>
          <View style={styles.badgeRowTop}>
            {product.isFeatured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>{t.common.featured}</Text>
              </View>
            )}
            {product.promotion && (
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>{product.promotion.discountPercent}% OFF</Text>
              </View>
            )}
          </View>
          {product.promotion ? (
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {formatPrice(product.promotion.discountedPrice)}
              </Text>
              <Text style={styles.originalPrice}>
                {formatPrice(product.price)}
              </Text>
            </View>
          ) : (
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          )}
          <Text style={styles.title}>{product.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{product.location}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{product.timePosted || product.time}</Text>
          </View>
        </View>

        {/* Details table */}
        {product.details?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.productDetail.title}</Text>
            {product.details.map((d, i) => (
              <View key={i} style={[styles.detailRow, i < product.details.length - 1 && styles.detailRowBorder]}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        {!!product.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.productDetail.description}</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>
        )}

        {/* Seller info */}
        {product.seller && (
          <TouchableOpacity
            style={styles.card}
            onPress={handleViewSupplier}
            activeOpacity={product.seller.id ? 0.75 : 1}
          >
            <View style={styles.sellerHeader}>
              <Text style={styles.cardTitle}>{t.productDetail.sellerInfo}</Text>
              {product.seller.id && (
                <View style={styles.viewProfileBtn}>
                  <Text style={styles.viewProfileText}>{t.productDetail.viewProfile}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              )}
            </View>
            <View style={styles.sellerRow}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerInitials}>{product.seller.initials || 'S'}</Text>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{product.seller.name}</Text>
                <View style={styles.sellerMeta}>
                  {product.seller.rating != null ? (
                    <>
                      <Ionicons name="star" size={14} color={colors.accent} />
                      <Text style={styles.sellerMetaText}>
                        {Number(product.seller.rating).toFixed(1)}  ·  {product.seller.sales ?? 0} sales
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.sellerMetaText}>{t.productDetail.noReviews}</Text>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>{t.productDetail.verified}</Text></View>
              <View style={styles.fastBadge}><Text style={styles.fastText}>{t.productDetail.fastResponse}</Text></View>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Action bar ─────────────────────────────────────────────────── */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 8 }]}>
        {/* Top row: Call + Chat (outline, secondary) */}
        <View style={styles.actionRowTop}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={16} color={colors.primary} />
            <Text style={styles.callBtnText}>{t.productDetail.call}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatBtn} onPress={handleChat} disabled={chatLoading}>
            {chatLoading
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <>
                  <Ionicons name="chatbubble-outline" size={16} color={colors.accent} />
                  <Text style={styles.chatBtnText}>{t.productDetail.chat}</Text>
                </>}
          </TouchableOpacity>
        </View>
        {/* Bottom row: Place Order (solid, primary, full-width) */}
        <TouchableOpacity style={styles.orderBtn} onPress={handleOpenOrder}>
          <Ionicons name="bag-check-outline" size={18} color="#fff" />
          <Text style={styles.orderBtnText}>{t.productDetail.placeOrder}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Order modal (bottom sheet) ──────────────────────────────────── */}
      <Modal
        visible={orderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { if (!orderLoading) setOrderModalVisible(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>

            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.productDetail.placeOrder}</Text>
              <TouchableOpacity
                onPress={() => { if (!orderLoading) setOrderModalVisible(false); }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Product summary */}
            <View style={styles.modalProductRow}>
              {images[0] ? (
                <Image source={{ uri: images[0] }} style={styles.modalThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.modalThumb, styles.modalThumbPlaceholder]}>
                  <Ionicons name="cube-outline" size={22} color={colors.textLight} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.modalProductName} numberOfLines={2}>{product.title}</Text>
                <Text style={styles.modalUnitPrice}>
                  Rs {parseFloat(displayPrice).toLocaleString()} / {product.unit || 'unit'}
                  {promo ? ` (${promo.discountPercent}% off)` : ''}
                </Text>
              </View>
            </View>

            {/* Quantity */}
            <Text style={styles.modalLabel}>{t.productDetail.quantity}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setOrderQty(q => String(Math.max(1, parseInt(q || '1', 10) - 1)))}
                disabled={orderLoading}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInput}
                value={orderQty}
                onChangeText={v => setOrderQty(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                selectTextOnFocus
                editable={!orderLoading}
              />
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setOrderQty(q => String(parseInt(q || '0', 10) + 1))}
                disabled={orderLoading}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyUnit}>{product.unit || 'units'}</Text>
            </View>

            {/* Live total */}
            {modalTotal && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t.productDetail.total}</Text>
                <Text style={styles.totalValue}>Rs {modalTotal}</Text>
              </View>
            )}

            {/* Notes */}
            <Text style={styles.modalLabel}>
              {t.productDetail.notes} <Text style={styles.optional}>{t.productDetail.optional}</Text>
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder={t.productDetail.notesPlaceholder}
              placeholderTextColor={colors.textLight}
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline
              textAlignVertical="top"
              editable={!orderLoading}
            />

            {/* Confirm */}
            <TouchableOpacity
              style={[styles.orderConfirmBtn, orderLoading && { opacity: 0.6 }]}
              onPress={handlePlaceOrder}
              disabled={orderLoading}
            >
              {orderLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.orderConfirmText}>{t.productDetail.confirmOrder}</Text>
                  </>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orderCancelBtn}
              onPress={() => setOrderModalVisible(false)}
              disabled={orderLoading}
            >
              <Text style={styles.orderCancelText}>{t.productDetail.cancel}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { alignItems: 'center', justifyContent: 'center', gap: 12 },

  // Image carousel
  imageContainer: { width: SCREEN_WIDTH, height: 280, backgroundColor: '#1a1a1a' },
  productImage:   { width: SCREEN_WIDTH, height: 280 },
  noImage:        { alignItems: 'center', justifyContent: 'center' },

  backBtn: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: 22, padding: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  saveBtn: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: 22, padding: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  dots: {
    position: 'absolute', bottom: 10, width: '100%',
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#fff', width: 16 },

  // Cards
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.xl,
    padding: spacing.md, marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  featuredBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.accent,
    borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.35)',
  },
  featuredText: { color: '#fff', fontSize: 10, fontFamily: fonts.semiBold },
  promoBadge: {
    alignSelf: 'flex-start', backgroundColor: '#16a34a',
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
  },
  promoBadgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.semiBold },

  badgeRowTop: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  promoBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.primary,
    borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.35)',
  },
  promoBadgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.semiBold },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  originalPrice: {
    fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },

  price:   { fontSize: 22, fontFamily: fonts.bold, color: colors.accent, marginBottom: 4 },
  title:   { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  metaDot:  { fontSize: 12, color: colors.textSecondary },

  cardTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 12 },

  detailRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel:     { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  detailValue:     { fontSize: 13, fontFamily: fonts.medium, color: colors.text },

  descText: { fontSize: 13, fontFamily: fonts.regular, color: colors.text, lineHeight: 20 },

  sellerHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewProfileBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewProfileText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },
  sellerRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sellerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: `${colors.primary}30`,
  },
  sellerInitials:  { fontSize: 16, fontFamily: fonts.bold, color: colors.primary },
  sellerInfo:      { flex: 1 },
  sellerName:      { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 4 },
  sellerMeta:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerMetaText:  { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  badgeRow:        { flexDirection: 'row', gap: 8 },
  verifiedBadge: {
    backgroundColor: `${colors.primary}18`, borderRadius: radii.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  verifiedText: { fontSize: 11, fontFamily: fonts.medium, color: colors.primary },
  fastBadge: {
    backgroundColor: `${colors.accent}18`, borderRadius: radii.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  fastText: { fontSize: 11, fontFamily: fonts.medium, color: colors.accent },

  // Action bar (3-button layout)
  actionBar: {
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    gap: 10,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 14,
  },
  actionRowTop: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: radii.xl, paddingVertical: 11,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  callBtnText: { color: colors.primary, fontSize: 13, fontFamily: fonts.semiBold },
  chatBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.accent,
    borderRadius: radii.xl, paddingVertical: 11,
    backgroundColor: colors.surface,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  chatBtnText: { color: colors.accent, fontSize: 13, fontFamily: fonts.semiBold },
  orderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.xl, paddingVertical: 14,
    borderBottomWidth: 4,
    borderBottomColor: '#0a524d',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
  },
  orderBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },

  // Error state
  errorText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  retryBtn:  { backgroundColor: colors.primary, borderRadius: radii.lg, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontFamily: fonts.medium, fontSize: 14 },

  // Order modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: 36,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  modalProductRow: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: colors.background, borderRadius: radii.lg, padding: 10,
  },
  modalThumb: { width: 56, height: 56, borderRadius: radii.md },
  modalThumbPlaceholder: {
    backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  modalProductName: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 4 },
  modalUnitPrice:   { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  modalLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text, marginTop: 4 },
  optional:   { fontFamily: fonts.regular, color: colors.textSecondary, fontSize: 12 },
  qtyRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 40, height: 40, borderRadius: radii.lg,
    borderWidth: 1.5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyInput: {
    width: 64, height: 40,
    backgroundColor: colors.surface, borderRadius: radii.lg,
    textAlign: 'center', fontSize: 16, fontFamily: fonts.semiBold, color: colors.text,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  qtyUnit: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, flex: 1 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: `${colors.primary}12`,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 10,
  },
  totalLabel: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.textSecondary },
  totalValue: { fontSize: 16, fontFamily: fonts.bold, color: colors.primary },
  notesInput: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: 12, fontSize: 13, fontFamily: fonts.regular, color: colors.text,
    minHeight: 72, maxHeight: 120,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  dragHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 8,
  },
  orderConfirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radii.xl, paddingVertical: 14, marginTop: 4,
    borderBottomWidth: 4, borderBottomColor: '#0a524d',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.35)',
  },
  orderConfirmText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
  orderCancelBtn:   { alignItems: 'center', paddingVertical: 10 },
  orderCancelText:  { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
});