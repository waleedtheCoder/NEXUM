import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';

export default function MyListingsManagementScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const listing = route.params?.listing;

  const [status, setStatus] = useState(listing?.status || 'active');

  const handleDelete = () => {
    Alert.alert('Remove Listing', 'Are you sure you want to remove this listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  // FIX: Edit listing now navigates to CreateListing with pre-filled data
  const handleEdit = () => {
    navigation.navigate('CreateListing', {
      category: listing?.category,
      editMode: true,
      existingListing: listing,
    });
  };

  const STATUS_COLORS = {
    active: { bg: 'rgba(132,204,22,0.15)', text: colors.green, border: colors.green },
    pending: { bg: 'rgba(249,115,22,0.15)', text: colors.accent, border: colors.accent },
    removed: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', border: '#EF4444' },
  };

  const sc = STATUS_COLORS[status] || STATUS_COLORS.active;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0F12" />
      <ScreenHeader
        title="Manage Listing"
        showBack
        rightElement={
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Product card */}
        <View style={styles.card}>
          <View style={styles.productRow}>
            <Image source={{ uri: listing?.imageUrl }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{listing?.productName}</Text>
              <Text style={styles.productSub}>{listing?.quantity} {listing?.unit}  •  {listing?.category}</Text>
              <Text style={styles.productPrice}>Rs {listing?.pricePerUnit?.toLocaleString()} / {listing?.unit}</Text>
            </View>
          </View>
        </View>

        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Listing Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.statsGrid}>
            {[
              { icon: 'eye', label: 'Views', value: listing?.views },
              { icon: 'chatbubble-ellipses', label: 'Inquiries', value: listing?.inquiries },
              { icon: 'location', label: 'Location', value: listing?.location },
              { icon: 'time', label: 'Posted', value: listing?.postedDate },
            ].map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <Ionicons name={`${stat.icon}-outline`} size={20} color={colors.primary} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total value */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.sectionTitle}>Total Value</Text>
            <Text style={styles.totalValue}>Rs {listing?.totalValue?.toLocaleString()}</Text>
          </View>
        </View>

        {/* Actions — FIX: Edit button now has onPress */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editBtnText}>Edit Listing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, status === 'active' ? styles.deactivateBtn : styles.activateBtn]}
            onPress={() => setStatus(status === 'active' ? 'pending' : 'active')}
          >
            <Ionicons name={status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'} size={18} color="#fff" />
            <Text style={styles.editBtnText}>{status === 'active' ? 'Deactivate' : 'Activate'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0F12' },
  scroll: { padding: spacing.md, paddingBottom: 32 },
  deleteBtn: { padding: 8, marginRight: 4 },
  card: {
    backgroundColor: '#1a1d23', borderRadius: radii.xl,
    padding: spacing.md, marginBottom: spacing.md, ...shadows.sm,
  },
  productRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  productImage: { width: 80, height: 80, borderRadius: radii.lg, backgroundColor: '#374151' },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontFamily: fonts.semiBold, color: '#F9FAFB', marginBottom: 4 },
  productSub: { fontSize: 12, fontFamily: fonts.regular, color: '#9CA3AF', marginBottom: 4 },
  productPrice: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.accent },
  sectionTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: '#F9FAFB', marginBottom: 10 },
  statusBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: radii.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  statusText: { fontSize: 13, fontFamily: fonts.semiBold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statItem: { width: '45%', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 15, fontFamily: fonts.semiBold, color: '#F9FAFB' },
  statLabel: { fontSize: 11, fontFamily: fonts.regular, color: '#9CA3AF' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.green },
  actionsRow: { flexDirection: 'row', gap: 12 },
  editBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radii.lg,
    paddingVertical: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  toggleBtn: {
    flex: 1, borderRadius: radii.lg, paddingVertical: 13,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  deactivateBtn: { backgroundColor: '#374151' },
  activateBtn: { backgroundColor: colors.green },
  editBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
});
