import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { deleteListing, updateListing } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

export default function MyListingsManagementScreen() {
  const navigation  = useNavigation();
  const route       = useRoute();
  const insets      = useSafeAreaInsets();
  const { colors }  = useTheme();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const listing = route.params?.listing;
  const [status, setStatus]         = useState(listing?.status || 'active');
  const [deleting, setDeleting]     = useState(false);
  const [publishing, setPublishing] = useState(false);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── Publish (pending → active) ────────────────────────────────────────
  const handlePublish = () => {
    Alert.alert(
      'Publish Listing',
      'This will make your listing visible to all shopkeepers in the marketplace.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            setPublishing(true);
            try {
              await updateListing(listing.id, { status: 'active' }, authArgs);
              setStatus('active');
              Alert.alert('Published!', 'Your listing is now live in the marketplace.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not publish listing. Please try again.');
            } finally {
              setPublishing(false);
            }
          },
        },
      ]
    );
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = () => {
    navigation.navigate('CreateListing', {
      category:        listing?.category,
      editMode:        true,
      existingListing: listing,
    });
  };

  // ── Delete (soft) ─────────────────────────────────────────────────────────
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

  const STATUS_CONFIG = {
    active:  { bg: `${colors.green}22`,  text: colors.green,  border: colors.green  },
    pending: { bg: `${colors.accent}22`, text: colors.accent, border: colors.accent },
    removed: { bg: `${colors.error}18`,  text: colors.error,  border: colors.error  },
  };
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  const price = listing?.pricePerUnit
    ? `Rs ${parseFloat(listing.pricePerUnit).toLocaleString()} / ${listing.unit || 'unit'}`
    : '—';

  const styles = makeStyles(colors);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader
        title="Manage Listing"
        showBack
        rightElement={
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
            {deleting
              ? <ActivityIndicator size="small" color={colors.error} />
              : <Ionicons name="trash-outline" size={20} color={colors.error} />
            }
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Product card ────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            {listing?.imageUrl ? (
              <Image
                source={{ uri: listing.imageUrl }}
                style={styles.thumb}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="cube-outline" size={28} color={colors.textLight} />
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {listing?.productName || '—'}
              </Text>
              <Text style={styles.category}>
                {listing?.category}{listing?.location ? ` · ${listing.location}` : ''}
              </Text>
              <Text style={styles.priceText}>{price}</Text>
            </View>
          </View>

          {/* Status pill */}
          <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <View style={[styles.statusDot, { backgroundColor: sc.text }]} />
            <Text style={[styles.statusText, { color: sc.text }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        {/* ── Stats row ───────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {[
            { icon: 'eye-outline',       color: colors.primary, value: listing?.views     ?? 0,   label: 'Views'     },
            { icon: 'chatbubble-outline', color: colors.accent,  value: listing?.inquiries ?? 0,   label: 'Inquiries' },
            { icon: 'cube-outline',       color: colors.green,   value: listing?.quantity  ?? '—', label: listing?.unit || 'qty' },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Ionicons name={s.icon} size={20} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Info card ───────────────────────────────────────────────── */}
        <View style={styles.infoCard}>
          {[
            { label: 'Location',  value: listing?.location   || '—' },
            { label: 'Condition', value: listing?.condition  || '—' },
            { label: 'Posted',    value: listing?.postedDate || '—' },
          ].map((row, i, arr) => (
            <View key={row.label}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.hairline} />}
            </View>
          ))}
        </View>

        {/* ── Description ─────────────────────────────────────────────── */}
        {!!listing?.description && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Description</Text>
            <Text style={[styles.infoValue, styles.descriptionText]}>
              {listing.description}
            </Text>
          </View>
        )}

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <View style={styles.actions}>

          {/* Publish — only shown when pending */}
          {status === 'pending' && (
            <TouchableOpacity
              style={styles.publishBtn}
              onPress={handlePublish}
              disabled={publishing}
            >
              {publishing
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Publish Listing</Text>
                  </>
              }
            </TouchableOpacity>
          )}

          {/* Edit — not shown when removed */}
          {status !== 'removed' && (
            <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Edit Listing</Text>
            </TouchableOpacity>
          )}

          {/* View Inquiries — always shown */}
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('ChatList')}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              View Inquiries
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  scroll:     { padding: spacing.md, gap: 14 },
  deleteBtn:  { padding: 6, width: 40, alignItems: 'flex-end' },

  // Product card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardRow:          { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 12 },
  thumb:            { width: 80, height: 80, borderRadius: radii.lg },
  thumbPlaceholder: { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  cardInfo:         { flex: 1 },
  productName:      { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text,          marginBottom: 4 },
  category:         { fontSize: 12, fontFamily: fonts.regular,  color: colors.textSecondary, marginBottom: 6 },
  priceText:        { fontSize: 15, fontFamily: fonts.bold,     color: colors.accent },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    borderRadius: radii.full, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: fonts.semiBold },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radii.xl,
    padding: spacing.sm, alignItems: 'center', gap: 4, ...shadows.sm,
  },
  statValue: { fontSize: 16, fontFamily: fonts.bold,    color: colors.text          },
  statLabel: { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary },

  // Info card
  infoCard:        { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md },
  infoRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  hairline:        { height: 1, backgroundColor: colors.border },
  infoLabel:       { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  infoValue:       { fontSize: 13, fontFamily: fonts.medium,  color: colors.text          },
  descriptionText: { marginTop: 6, lineHeight: 20 },

  // Actions
  actions: { gap: 10 },
  publishBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.green, borderRadius: radii.xl, paddingVertical: 14,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radii.xl, paddingVertical: 14,
  },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: `${colors.primary}12`, borderRadius: radii.xl, paddingVertical: 14,
    borderWidth: 1, borderColor: `${colors.primary}40`,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
});