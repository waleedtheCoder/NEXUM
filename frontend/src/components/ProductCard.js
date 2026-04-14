import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function ProductCard({ product, viewMode = 'grid', onPress }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [liked, setLiked] = useState(false);
  const price = `Rs ${product.price?.toLocaleString()}`;

  if (viewMode === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.88}>
        <View style={styles.listImageWrap}>
          {product.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.listImage} resizeMode="cover" />
          ) : (
            <View style={[styles.listImage, styles.imageFallback]}>
              <Ionicons name="cube-outline" size={28} color={colors.textLight} />
            </View>
          )}
        </View>
        <View style={styles.listInfo}>
          <TouchableOpacity style={styles.listHeart} onPress={() => setLiked(!liked)}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? '#EF4444' : colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.priceText}>{price}</Text>
          <Text style={styles.nameText} numberOfLines={2}>{product.title}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid card
  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.88}>
      {product.isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      <TouchableOpacity style={styles.heartBtn} onPress={() => setLiked(!liked)}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={15}
          color={liked ? '#EF4444' : colors.textLight}
        />
      </TouchableOpacity>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.gridImage} resizeMode="cover" />
      ) : (
        <View style={[styles.gridImage, styles.imageFallback]}>
          <Ionicons name="cube-outline" size={32} color={colors.textLight} />
        </View>
      )}
      <View style={styles.gridInfo}>
        <Text style={styles.priceText}>{price}</Text>
        <Text style={styles.nameTextSmall} numberOfLines={2}>{product.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,   // 24
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.backgroundAlt,
  },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  gridInfo: { padding: 10, gap: 3 },

  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  listImageWrap: { width: 110, height: 110, position: 'relative' },
  listImage:     { width: '100%', height: '100%', backgroundColor: colors.backgroundAlt },
  listInfo:      { flex: 1, padding: 12, justifyContent: 'space-between' },
  listHeart:     { alignSelf: 'flex-end' },

  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    // Inner highlight
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
  },
  featuredText: { color: '#fff', fontSize: 9, fontFamily: fonts.semiBold },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  priceText:     { color: colors.primary, fontSize: 15, fontFamily: fonts.bold, marginBottom: 3 },
  nameText:      { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.regular, lineHeight: 17 },
  nameTextSmall: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.regular, lineHeight: 15 },
});
