import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Dimensions, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';
import { getListingDetail, toggleSaveListing, startConversation } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, isLoggedIn, updateUser } = useUser();

  // route.params.product can be a full detail object (from deep-link) OR just a card stub
  const stub = route.params?.product;
  const [product, setProduct] = useState(stub || null);
  const [loading, setLoading] = useState(!stub?.details);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [savingInFlight, setSavingInFlight] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  // ── Fetch full detail ──────────────────────────────────────────────────
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
        const data = await getListingDetail(stub.id);
        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [stub?.id]);

  // ── Save / unsave ───────────────────────────────────────────────────────
  const handleSaveToggle = async () => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to save listings.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('LoginSignupOption') },
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
      setSaved(!willSave); // revert
    } finally {
      setSavingInFlight(false);
    }
  };

  // ── Call Seller ─────────────────────────────────────────────────────────
  const handleCall = () => {
    const phone = product?.seller?.phone || '';
    if (!phone) { Alert.alert('Not available', 'Seller phone number is not listed.'); return; }
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Error', 'Could not open phone dialler.')
    );
  };

  // ── Start Chat ──────────────────────────────────────────────────────────
  const handleChat = async () => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to contact suppliers.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('LoginSignupOption') },
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
        Alert.alert('Own Listing', 'You cannot start a conversation about your own listing.');
      } else {
        Alert.alert('Error', err.message || 'Could not start conversation.');
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

  // ── Render ──────────────────────────────────────────────────────────────
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
        <Text style={styles.errorText}>{error || 'Product not found.'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images?.length ? product.images : [product.imageUrl].filter(Boolean);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Image carousel */}
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

        {/* Back + save buttons */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToggle}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? colors.accent : '#fff'} />
        </TouchableOpacity>

        {/* Dot indicators */}
        {images.length > 1 && (
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentImage && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Price + title */}
        <View style={styles.card}>
          {product.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
          <Text style={styles.price}>Rs {product.price}</Text>
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
            <Text style={styles.cardTitle}>Product Details</Text>
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
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>
        )}

        {/* Seller info — tappable → SupplierProfile */}
        {product.seller && (
          <TouchableOpacity
            style={styles.card}
            onPress={handleViewSupplier}
            activeOpacity={product.seller.id ? 0.75 : 1}
          >
            <View style={styles.sellerHeader}>
              <Text style={styles.cardTitle}>Seller Information</Text>
              {product.seller.id && (
                <View style={styles.viewProfileBtn}>
                  <Text style={styles.viewProfileText}>View Profile</Text>
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
                  <Ionicons name="star" size={14} color={colors.accent} />
                  <Text style={styles.sellerMetaText}>
                    {product.seller.rating}  ·  {product.seller.sales} sales
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>Verified</Text></View>
              <View style={styles.fastBadge}><Text style={styles.fastText}>Fast Response</Text></View>
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Action buttons */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Ionicons name="call" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Call Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatBtn} onPress={handleChat} disabled={chatLoading}>
          {chatLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Chat</Text>
              </>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },

  imageContainer: { width: SCREEN_WIDTH, height: 280, backgroundColor: '#1a1a1a' },
  productImage: { width: SCREEN_WIDTH, height: 280 },
  noImage: { alignItems: 'center', justifyContent: 'center' },

  backBtn: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: 8,
  },
  saveBtn: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: 8,
  },
  dots: { position: 'absolute', bottom: 10, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#fff', width: 16 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  card: {
    backgroundColor: colors.surface, borderRadius: radii.xl,
    padding: spacing.md, marginBottom: 12, ...shadows.sm,
  },

  featuredBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.accent,
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8,
  },
  featuredText: { color: '#fff', fontSize: 10, fontFamily: fonts.semiBold },

  price: { fontSize: 22, fontFamily: fonts.bold, color: colors.accent, marginBottom: 4 },
  title: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  metaDot: { fontSize: 12, color: colors.textSecondary },

  cardTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 12 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  detailValue: { fontSize: 13, fontFamily: fonts.medium, color: colors.text },

  descText: { fontSize: 13, fontFamily: fonts.regular, color: colors.text, lineHeight: 20 },

  // Seller card — tappable
  sellerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewProfileText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sellerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  sellerInitials: { fontSize: 16, fontFamily: fonts.bold, color: colors.primary },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 4 },
  sellerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerMetaText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  badgeRow: { flexDirection: 'row', gap: 8 },
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

  actionBar: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: spacing.md, paddingTop: 12,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radii.xl, paddingVertical: 14,
  },
  chatBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accent, borderRadius: radii.xl, paddingVertical: 14,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },

  errorText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radii.lg, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontFamily: fonts.medium, fontSize: 14 },
});