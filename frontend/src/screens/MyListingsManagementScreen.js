import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';
import { deleteListing } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

export default function MyListingsManagementScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const listing = route.params?.listing;
  const [status, setStatus] = useState(listing?.status || 'active');
  const [deleting, setDeleting] = useState(false);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── Delete listing ──────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Remove Listing',
      'Are you sure you want to remove this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteListing(listing.id, authArgs);
              setStatus('removed');
              Alert.alert('Done', 'Listing has been removed.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              setDeleting(false);
              Alert.alert('Error', err.message || 'Could not remove the listing. Please try again.');
            }
          },
        },
      ]
    );
  };

  // ── Edit listing — navigate to CreateListing in edit mode ───────────────
  const handleEdit = () => {
    navigation.navigate('CreateListing', {
      category: listing?.category,
      editMode: true,
      existingListing: listing,
    });
  };

  const STATUS_COLORS = {
    active:  { bg: 'rgba(132,204,22,0.15)', text: colors.green,  border: colors.green  },
    pending: { bg: 'rgba(249,115,22,0.15)', text: colors.accent, border: colors.accent },
    removed: { bg: 'rgba(239,68,68,0.15)',  text: '#EF4444',     border: '#EF4444'     },
  };
  const sc = STATUS_COLORS[status] || STATUS_COLORS.active;

  const price = listing?.pricePerUnit ? parseFloat(listing.pricePerUnit).toLocaleString() : '—';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />
      <ScreenHeader
        title="Manage Listing"
        showBack
        rightElement={
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
            {deleting
              ? <ActivityIndicator size="small" color="#EF4444" />
              : <Ionicons name="trash-outline" size={20} color="#EF4444" />}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Product card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            {listing?.imageUrl ? (
              <Image source={{ uri: listing.imageUrl }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="cube-outline" size={28} color="#374151" />
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.productName}>{listing?.productName || '—'}</Text>
              <Text style={styles.category}>{listing?.category} · {listing?.location}</Text>
              <Text style={styles.priceText}>Rs {price} / {listing?.unit}</Text>
            </View>
          </View>
        </View>

        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          <View style={[styles.statusDot, { backgroundColor: sc.text }]} />
          <Text style={[styles.statusText, { color: sc.text }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="eye-outline" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{listing?.views ?? 0}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.accent} />
            <Text style={styles.statValue}>{listing?.inquiries ?? 0}</Text>
            <Text style={styles.statLabel}>Inquiries</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="cube-outline" size={20} color={colors.green} />
            <Text style={styles.statValue}>{listing?.quantity}</Text>
            <Text style={styles.statLabel}>Qty ({listing?.unit})</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="cash-outline" size={20} color="#8B5CF6" />
            <Text style={styles.statValue}>
              {listing?.totalValue ? `${(listing.totalValue / 1000).toFixed(0)}k` : '—'}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Posted</Text>
            <Text style={styles.infoValue}>{listing?.postedDate || '—'}</Text>
          </View>
          <View style={styles.hairline} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Listing ID</Text>
            <Text style={styles.infoValue}>{listing?.id || '—'}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.actionText}>Edit Listing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('ChatList')}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>View Inquiries</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  scroll: { padding: spacing.md, gap: 14 },
  deleteBtn: { padding: 6 },

  card: {
    backgroundColor: '#1F2937', borderRadius: radii.xl, padding: spacing.md, ...shadows.sm,
  },
  cardRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  thumb: { width: 80, height: 80, borderRadius: radii.lg },
  thumbPlaceholder: { backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  productName: { fontSize: 15, fontFamily: fonts.semiBold, color: '#fff', marginBottom: 4 },
  category: { fontSize: 12, fontFamily: fonts.regular, color: '#9CA3AF', marginBottom: 6 },
  priceText: { fontSize: 15, fontFamily: fonts.bold, color: colors.accent },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    borderRadius: radii.full, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: fonts.semiBold },

  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, backgroundColor: '#1F2937', borderRadius: radii.xl,
    padding: spacing.sm, alignItems: 'center', gap: 4, ...shadows.sm,
  },
  statValue: { fontSize: 16, fontFamily: fonts.bold, color: '#fff' },
  statLabel: { fontSize: 10, fontFamily: fonts.regular, color: '#9CA3AF' },

  infoCard: { backgroundColor: '#1F2937', borderRadius: radii.xl, padding: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  hairline: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  infoLabel: { fontSize: 13, fontFamily: fonts.regular, color: '#9CA3AF' },
  infoValue: { fontSize: 13, fontFamily: fonts.medium, color: '#fff' },

  actions: { gap: 10 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radii.xl, paddingVertical: 14,
  },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: `${colors.primary}18`, borderRadius: radii.xl, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.primary,
  },
  actionText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
});
