import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Dimensions, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

const DEFAULT_PRODUCT = {
  id: '1',
  title: 'Premium Basmati Rice 25kg',
  price: 8800,
  location: 'Lahore Wholesale Market',
  timePosted: '2 hours ago',
  isFeatured: true,
  images: [
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=600&fit=crop',
  ],
  details: [
    { label: 'Category', value: 'Rice & Grains' },
    { label: 'Quantity', value: '500 kg available' },
    { label: 'Min. Order', value: '25 kg' },
    { label: 'Condition', value: 'Bulk Wholesale' },
  ],
  description: 'High quality premium basmati rice, aged 2 years. Long grain, aromatic, suitable for biryani and pilaf. Available in 25kg bags. Bulk discounts available for orders above 100kg.',
  seller: {
    name: 'Bismillah Rice Mills',
    initials: 'BR',
    rating: 4.8,
    sales: 340,
    phone: '+92 300 1234567',
  },
};

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const product = route.params?.product || DEFAULT_PRODUCT;
  const [saved, setSaved] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const images = product.images || [product.imageUrl];

  // FIX: Call Seller — opens phone dialer
  const handleCall = () => {
    const phone = product.seller?.phone || '+92 300 0000000';
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Error', 'Could not open phone dialer.')
    );
  };

  // FIX: Chat — navigates to conversation with this specific seller
  const handleChat = () => {
    navigation.navigate('ChatConversation', {
      chat: {
        id: product.id || '1',
        username: product.seller?.name || 'Seller',
        avatarInitial: (product.seller?.name || 'S')[0],
        avatarColor: colors.primary,
        productTitle: product.title,
      },
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={styles.carouselWrap}>
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onScroll={(e) => setCurrentImage(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
            scrollEventThrottle={16}
          >
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.carouselImage} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Counter */}
          <View style={styles.counter}>
            <Text style={styles.counterText}>{currentImage + 1}/{images.length}</Text>
          </View>

          {/* Floating buttons */}
          <View style={styles.floatingBtns}>
            <TouchableOpacity style={styles.floatBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatBtn} onPress={() => setSaved(!saved)}>
              <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? colors.accent : '#fff'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Price & badge */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>Rs {product.price?.toLocaleString() || '8,800'}</Text>
            {product.isFeatured && (
              <View style={styles.featBadge}><Text style={styles.featText}>Featured</Text></View>
            )}
          </View>

          <Text style={styles.title}>{product.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-sharp" size={14} color={colors.primary} />
            <Text style={styles.metaText}>{product.location}  •  {product.timePosted || '2h ago'}</Text>
          </View>

          {/* Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Details</Text>
            {(product.details || DEFAULT_PRODUCT.details).map((d, i) => (
              <View key={i}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  <Text style={styles.detailValue}>{d.value}</Text>
                </View>
                {i < (product.details || DEFAULT_PRODUCT.details).length - 1 && <View style={styles.hairline} />}
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.descText}>{product.description || DEFAULT_PRODUCT.description}</Text>
          </View>

          {/* Seller */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Seller Information</Text>
            <View style={styles.sellerRow}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerInitials}>
                  {(product.seller?.initials || DEFAULT_PRODUCT.seller.initials)}
                </Text>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{product.seller?.name || DEFAULT_PRODUCT.seller.name}</Text>
                <View style={styles.sellerMeta}>
                  <Ionicons name="star" size={14} color={colors.accent} />
                  <Text style={styles.sellerMetaText}>
                    {product.seller?.rating || DEFAULT_PRODUCT.seller.rating}  •  {product.seller?.sales || DEFAULT_PRODUCT.seller.sales} sales
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>Verified</Text></View>
              <View style={styles.fastBadge}><Text style={styles.fastText}>Fast Response</Text></View>
            </View>
          </View>

          <View style={{ height: 90 }} />
        </View>
      </ScrollView>

      {/* Fixed action buttons — FIX: both have real handlers */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Ionicons name="call" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Call Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  carouselWrap: { position: 'relative' },
  carouselImage: { width: SCREEN_WIDTH, height: 360 },
  counter: {
    position: 'absolute', bottom: 14, right: 14,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radii.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  counterText: { color: '#F9FAFB', fontSize: 12, fontFamily: fonts.medium },
  floatingBtns: {
    position: 'absolute', top: 14, left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  floatBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(26,29,35,0.8)', alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  price: { fontSize: 28, fontFamily: fonts.bold, color: colors.accent },
  featBadge: { backgroundColor: colors.green, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 3 },
  featText: { color: '#0D0F12', fontSize: 11, fontFamily: fonts.semiBold },
  title: { fontSize: 18, fontFamily: fonts.semiBold, color: '#F9FAFB', marginBottom: 8, lineHeight: 26 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.lg },
  metaText: { fontSize: 13, color: '#6B7280', fontFamily: fonts.regular },
  card: {
    backgroundColor: '#1a1d23', borderRadius: radii.xl, padding: spacing.md,
    marginBottom: spacing.md, ...shadows.sm,
  },
  cardTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: '#F9FAFB', marginBottom: spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  detailLabel: { fontSize: 13, color: '#9CA3AF', fontFamily: fonts.regular },
  detailValue: { fontSize: 13, color: '#F9FAFB', fontFamily: fonts.medium },
  hairline: { height: 1, backgroundColor: '#2a2d33' },
  descText: { fontSize: 13, color: '#9CA3AF', fontFamily: fonts.regular, lineHeight: 20 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  sellerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  sellerInitials: { color: '#fff', fontSize: 18, fontFamily: fonts.bold },
  sellerInfo: { flex: 1 },
  sellerName: { color: '#F9FAFB', fontSize: 15, fontFamily: fonts.semiBold, marginBottom: 4 },
  sellerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerMetaText: { fontSize: 12, color: '#9CA3AF', fontFamily: fonts.regular },
  badgeRow: { flexDirection: 'row', gap: 8 },
  verifiedBadge: {
    borderWidth: 1, borderColor: 'rgba(15,118,110,0.4)',
    backgroundColor: 'rgba(15,118,110,0.15)', borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  verifiedText: { fontSize: 11, color: colors.primary, fontFamily: fonts.medium },
  fastBadge: {
    borderWidth: 1, borderColor: 'rgba(132,204,22,0.4)',
    backgroundColor: 'rgba(132,204,22,0.15)', borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  fastText: { fontSize: 11, color: colors.green, fontFamily: fonts.medium },
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, paddingHorizontal: spacing.md, paddingTop: spacing.md,
    backgroundColor: 'rgba(13,15,18,0.96)',
  },
  callBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radii.lg,
    paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  chatBtn: {
    flex: 1, backgroundColor: colors.accent, borderRadius: radii.lg,
    paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
});
