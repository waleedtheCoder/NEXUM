import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function ListingCard({ listing, onPress, onMenuPress }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.row}>
        {/* Product image */}
        {listing.imageUrl ? (
          <Image source={{ uri: listing.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="cube-outline" size={28} color={colors.textLight} />
          </View>
        )}

        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{listing.productName}</Text>
            <TouchableOpacity
              onPress={onMenuPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.menuBtn}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{listing.category}</Text>
          </View>

          <Text style={styles.price}>
            <Text style={styles.priceValue}>Rs {listing.pricePerUnit?.toLocaleString()}</Text>
            {' '}/ {listing.unit}{'  ·  '}{listing.quantity} {listing.unit}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="eye-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.statText}>{listing.views}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="chatbubble-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.statText}>{listing.inquiries}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.statText}>
                {Array.isArray(listing.cities) && listing.cities.length > 0
                  ? listing.cities.slice(0, 2).join(', ') + (listing.cities.length > 2 ? ` +${listing.cities.length - 2}` : '')
                  : 'Nationwide'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer strip */}
      <View style={styles.footer}>
        <Text style={styles.footerDate}>{listing.postedDate}</Text>
        <Text style={styles.footerTotal}>
          Total: Rs {listing.totalValue?.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,   // 24
    overflow: 'hidden',
    marginBottom: 14,
    // Multi-layer lift shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: radii.md,   // 16
    backgroundColor: colors.backgroundAlt,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginRight: 4,
  },
  menuBtn: {
    padding: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}18`,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: `${colors.primary}28`,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  price: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceValue: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 13,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },

  // Footer strip
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surfaceAlt,
  },
  footerDate:  { fontSize: 11, fontFamily: fonts.regular, color: colors.textLight },
  footerTotal: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.primary },
});
