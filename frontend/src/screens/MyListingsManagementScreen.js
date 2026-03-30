import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { deleteListing, updateListing, setListingPromotion, removeListingPromotion } from '../services/marketplaceApi';
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

  // Promotion state — initialised from listing.promotion passed via route params
  const [promotion, setPromotion]       = useState(listing?.promotion || null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoInput, setPromoInput]     = useState('');
  const [promoSaving, setPromoSaving]   = useState(false);
  const [promoRemoving, setPromoRemoving] = useState(false);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── Publish (pending → active) ────────────────────────────────────────
  const handlePublish = async () => {
  setPublishing(true);
  try {
    await updateListing(listing.id, { status: 'active' }, authArgs);
    setStatus('active');
  } catch (err) {
    Alert.alert('Error', err.message || 'Could not publish listing. Please try again.');
  } finally {
    setPublishing(false);
  }
};

  // ── Promotion ─────────────────────────────────────────────────────────────
  const handleSavePromotion = async () => {
    const pct = parseInt(promoInput, 10);
    if (isNaN(pct) || pct < 1 || pct > 99) {
      Alert.alert('Invalid discount', 'Enter a number between 1 and 99.');
      return;
    }
    setPromoSaving(true);
    try {
      const result = await setListingPromotion(listing.id, pct, authArgs);
      setPromotion({ discountPercent: result.discountPercent, discountedPrice: result.discountedPrice });
      setShowPromoModal(false);
      setPromoInput('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save promotion.');
    } finally {
      setPromoSaving(false);
    }
  };

  const handleRemovePromotion = () => {
    Alert.alert('Remove Promotion', 'Remove the discount from this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setPromoRemoving(true);
          try {
            await removeListingPromotion(listing.id, authArgs);
            setPromotion(null);
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not remove promotion.');
          } finally {
            setPromoRemoving(false);
          }
        },
      },
    ]);
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

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

        {/* ── Promotion ───────────────────────────────────────────────── */}
        {status === 'active' && (
          promotion ? (
            <View style={styles.promoCard}>
              <View style={styles.promoCardHeader}>
                <View style={styles.promoCardLeft}>
                  <Ionicons name="pricetag" size={18} color={colors.accent} />
                  <Text style={styles.promoCardTitle}>Active Promotion</Text>
                </View>
                <TouchableOpacity onPress={handleRemovePromotion} disabled={promoRemoving}>
                  {promoRemoving
                    ? <ActivityIndicator size="small" color={colors.accent} />
                    : <Ionicons name="close-circle-outline" size={20} color={colors.accent} />
                  }
                </TouchableOpacity>
              </View>
              <View style={styles.promoRow}>
                <View style={styles.promoStat}>
                  <Text style={styles.promoStatValue}>{promotion.discountPercent}%</Text>
                  <Text style={styles.promoStatLabel}>Discount</Text>
                </View>
                <View style={styles.promoStatDivider} />
                <View style={styles.promoStat}>
                  <Text style={styles.promoStatValue}>
                    Rs {parseFloat(promotion.discountedPrice).toLocaleString()}
                  </Text>
                  <Text style={styles.promoStatLabel}>Promo price / {listing?.unit || 'unit'}</Text>
                </View>
                <View style={styles.promoStatDivider} />
                <View style={styles.promoStat}>
                  <Text style={[styles.promoStatValue, styles.promoOldPrice]}>
                    Rs {parseFloat(listing?.pricePerUnit || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.promoStatLabel}>Original</Text>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.promoAddBtn}
              onPress={() => { setPromoInput(''); setShowPromoModal(true); }}
            >
              <Ionicons name="pricetag-outline" size={18} color={colors.accent} />
              <Text style={styles.promoAddBtnText}>Put on Promotion</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.accent} />
            </TouchableOpacity>
          )
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

      {/* ── Promotion modal ───────────────────────────────────────────── */}
      <Modal
        visible={showPromoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPromoModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set Promotion</Text>
            <Text style={styles.modalSub}>
              Enter the discount percentage for "{listing?.productName}".
              Shopkeepers will see the reduced price on the home screen.
            </Text>

            <View style={styles.modalInputWrap}>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 20"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
                value={promoInput}
                onChangeText={setPromoInput}
                maxLength={2}
                autoFocus
              />
              <Text style={styles.modalInputSuffix}>%</Text>
            </View>

            {promoInput !== '' && !isNaN(parseInt(promoInput, 10)) && (
              <View style={styles.modalPreview}>
                <Text style={styles.modalPreviewLabel}>New price</Text>
                <Text style={styles.modalPreviewPrice}>
                  Rs {(parseFloat(listing?.pricePerUnit || 0) * (1 - parseInt(promoInput, 10) / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  {' '}/{' '}{listing?.unit || 'unit'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalSaveBtn, promoSaving && { opacity: 0.6 }]}
              onPress={handleSavePromotion}
              disabled={promoSaving}
            >
              {promoSaving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.modalSaveBtnText}>Activate Promotion</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPromoModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

  // Promotion card (active)
  promoCard: {
    backgroundColor: `${colors.accent}10`, borderWidth: 1, borderColor: `${colors.accent}40`,
    borderRadius: radii.xl, padding: spacing.md,
  },
  promoCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  promoCardLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promoCardTitle:  { fontSize: 14, fontFamily: fonts.semiBold, color: colors.accent },
  promoRow:        { flexDirection: 'row', alignItems: 'center' },
  promoStat:       { flex: 1, alignItems: 'center', gap: 2 },
  promoStatDivider:{ width: 1, height: 32, backgroundColor: `${colors.accent}30` },
  promoStatValue:  { fontSize: 14, fontFamily: fonts.bold, color: colors.text },
  promoStatLabel:  { fontSize: 10, fontFamily: fonts.regular, color: colors.textSecondary },
  promoOldPrice:   { textDecorationLine: 'line-through', color: colors.textSecondary },

  // Put on promotion button
  promoAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: `${colors.accent}10`, borderWidth: 1, borderColor: `${colors.accent}40`,
    borderRadius: radii.xl, paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  promoAddBtnText: { flex: 1, fontSize: 14, fontFamily: fonts.semiBold, color: colors.accent },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: 36, gap: 14,
  },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 4 },
  modalTitle:   { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  modalSub:     { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 20 },
  modalInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.lg, paddingHorizontal: 16,
  },
  modalInput: {
    flex: 1, paddingVertical: 14, fontSize: 28, fontFamily: fonts.bold, color: colors.text,
    textAlign: 'center',
  },
  modalInputSuffix: { fontSize: 22, fontFamily: fonts.bold, color: colors.textSecondary },
  modalPreview: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.md,
  },
  modalPreviewLabel: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  modalPreviewPrice: { fontSize: 15, fontFamily: fonts.bold, color: colors.accent },
  modalSaveBtn: {
    backgroundColor: colors.accent, borderRadius: radii.xl, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  modalSaveBtnText: { color: '#fff', fontSize: 16, fontFamily: fonts.semiBold },
  modalCancelBtn:   { alignItems: 'center', paddingVertical: 8 },
  modalCancelText:  { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
});