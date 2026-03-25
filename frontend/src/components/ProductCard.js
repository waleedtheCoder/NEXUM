import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, shadows } from '../constants/theme';

export default function ProductCard({ product, viewMode = 'grid', onPress }) {
  const [liked, setLiked] = useState(false);
  const price = `Rs ${product.price?.toLocaleString()}`;

  if (viewMode === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.listImageWrap}>
          {product.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
          <Image source={{ uri: product.imageUrl }} style={styles.listImage} resizeMode="cover" />
        </View>
        <View style={styles.listInfo}>
          <TouchableOpacity style={styles.listHeart} onPress={() => setLiked(!liked)}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={colors.green}
            />
          </TouchableOpacity>
          <Text style={styles.priceText}>{price}</Text>
          <Text style={styles.nameText} numberOfLines={2}>{product.title}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.85}>
      {product.isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.heartBtn}
        onPress={() => setLiked(!liked)}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={16}
          color={colors.green}
        />
      </TouchableOpacity>
      <Image source={{ uri: product.imageUrl }} style={styles.gridImage} resizeMode="cover" />
      <View style={styles.gridInfo}>
        <Text style={styles.priceText}>{price}</Text>
        <Text style={styles.nameTextSmall} numberOfLines={2}>{product.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.border,
  },
  gridInfo: { padding: 10 },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.sm,
    marginBottom: 12,
  },
  listImageWrap: { width: 110, height: 110, position: 'relative' },
  listImage: { width: '100%', height: '100%', backgroundColor: colors.border },
  listInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  listHeart: { alignSelf: 'flex-end' },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  featuredText: { color: '#fff', fontSize: 10, fontFamily: fonts.semiBold },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 5,
    ...shadows.sm,
  },
  priceText: { color: colors.primary, fontSize: 15, fontFamily: fonts.semiBold, marginBottom: 2 },
  nameText: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.regular },
  nameTextSmall: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.regular },
});
