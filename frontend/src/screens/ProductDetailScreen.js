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
  const [loading, setLoading] = useState(!stub?.details); // fetch only when detail fields missing
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [savingInFlight, setSavingInFlight] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  // ── Fetch full detail ──────────────────────────────────────────────────
  useEffect(() => {
    if (!stub?.id) return;
    // If we already have all detail fields skip the fetch
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
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images?.length
    ? product.images
    : [product.imageUrl].filter(Boolean);

  const price = parseFloat(product.price || 0).toLocaleString();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={styles.carouselWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) =>
              setCurrentImage(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
            }
            scrollEventThrottle={16}
          >
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.carouselImage} resizeMode="cover" />
            ))}
          </ScrollView>

          <View style={styles.counter}>
            <Text style={styles.counterText}>{currentImage + 1}/{images.length}</Text>
          </View>

          <View style={styles.floatingBtns}>
            <TouchableOpacity style={styles.floatBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatBtn} onPress={handleSaveToggle} disabled={savingInFlight}>
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={20}
                color={saved ? colors.accent : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Price & badge */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>Rs {price}</Text>
            {product.isFeatured && (
              <View style={styles.featBadge}><Text style={styles.featText}>Featured</Text></View>
            )}
          </View>

          <Text style={styles.title}>{product.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-sharp" size={14} color={colors.primary} />
            <Text style={styles.metaText}>
              {product.location}  •  {product.timePosted || '—'}
            </Text>
          </View>

          {/* Details table */}
          {product.details?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Details</Text>
              {product.details.map((d, i) => (
                <View key={i}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{d.label}</Text>
                    <Text style={styles.detailValue}>{d.value}</Text>
                  </View>
                  {i < product.details.length - 1 && <View style={styles.hairline} />}
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

          {/* Seller info */}
          {product.seller && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Seller Information</Text>
              <View style={styles.sellerRow}>
                <View style={styles.sellerAvatar}>
                  <Text style={styles.sellerInitials}>{product.seller.initials || 'S'}</Text>
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{product.seller.name}</Text>
                  <View style={styles.sellerMeta}>
                    <Ionicons name="star" size={14} color={colors.accent} />
                    <Text style={styles.sellerMetaText}>
                      {product.seller.rating}  •  {product.seller.sales} sales
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.badgeRow}>
                <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>Verified</Text></View>
                <View style={styles.fastBadge}><Text style={styles.fastText}>Fast Response</Text></View>
              </View>
            </View>
          )}

          <View style={{ height: 90 }} />
        </View>
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
            : <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />}
          <Text style={styles.actionBtnText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  errorText: { color: '#9CA3AF', fontSize: 14, fontFamily: fonts.regular, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radii.full },
  retryText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },

  carouselWrap: { position: 'relative' },
  carouselImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 },
  counter: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  counterText: { color: '#fff', fontSize: 12, fontFamily: fonts.medium },
  floatingBtns: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', padding: 16,
  },
  floatBtn: {
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: 10, ...shadows.sm,
  },

  content: { padding: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  price: { fontSize: 24, fontFamily: fonts.bold, color: colors.accent },
  featBadge: {
    backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
  },
  featText: { color: '#fff', fontSize: 11, fontFamily: fonts.semiBold },
  title: { fontSize: 18, fontFamily: fonts.semiBold, color: '#fff', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  metaText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface, borderRadius: radii.xl,
    padding: spacing.md, marginBottom: spacing.md, ...shadows.sm,
  },
  cardTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  detailValue: { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  hairline: { height: 1, backgroundColor: colors.border },
  descText: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 22 },

  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sellerAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sellerInitials: { fontSize: 18, fontFamily: fonts.bold, color: '#fff' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 4 },
  sellerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerMetaText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  badgeRow: { flexDirection: 'row', gap: 8 },
  verifiedBadge: {
    backgroundColor: `${colors.primary}20`, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.primary,
  },
  verifiedText: { fontSize: 11, fontFamily: fonts.medium, color: colors.primary },
  fastBadge: {
    backgroundColor: `${colors.accent}20`, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.accent,
  },
  fastText: { fontSize: 11, fontFamily: fonts.medium, color: colors.accent },

  actionBar: {
    flexDirection: 'row', gap: 12, paddingHorizontal: spacing.md,
    paddingTop: 12, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#374151', borderRadius: radii.lg, paddingVertical: 14,
  },
  chatBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 14,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
});
