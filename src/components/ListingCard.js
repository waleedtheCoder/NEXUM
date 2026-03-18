import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, shadows } from '../constants/theme';

export default function ListingCard({ listing, onPress, onMenuPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        <Image source={{ uri: listing.imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{listing.productName}</Text>
            <TouchableOpacity onPress={onMenuPress}>
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{listing.category}</Text>
          </View>
          <Text style={styles.price}>
            <Text style={styles.priceValue}>Rs {listing.pricePerUnit?.toLocaleString()}</Text>
            {' '}/ {listing.unit}  •  {listing.quantity} {listing.unit}
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
              <Text style={styles.statText}>{listing.location}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerDate}>{listing.postedDate}</Text>
        <Text style={styles.footerTotal}>Total: Rs {listing.totalValue?.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 12,
    ...shadows.sm,
  },
  row: { flexDirection: 'row', gap: 10, padding: 10 },
  image: { width: 90, height: 90, borderRadius: radii.sm, backgroundColor: colors.border },
  details: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { flex: 1, fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginRight: 4 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  categoryText: { fontSize: 11, fontFamily: fonts.medium, color: colors.primary },
  price: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginBottom: 6 },
  priceValue: { fontFamily: fonts.semiBold, color: colors.primary },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerDate: { fontSize: 11, fontFamily: fonts.regular, color: colors.textLight },
  footerTotal: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.primary },
});
