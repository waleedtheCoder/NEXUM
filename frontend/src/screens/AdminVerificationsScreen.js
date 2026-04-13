import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { getAdminVerifications, approveVerification } from '../services/adminApi';

export default function AdminVerificationsScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [approving, setApproving] = useState(null); // supplier id being approved

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminVerifications();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load verification requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchRequests(); }, [fetchRequests]));

  const handleApprove = (supplier) => {
    Alert.alert(
      'Approve Verification',
      `Verify "${supplier.name}"? This will give them a verified badge and feature all their active listings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setApproving(supplier.id);
            try {
              await approveVerification(supplier.id);
              setRequests((prev) => prev.filter((s) => s.id !== supplier.id));
              Alert.alert('Approved', `${supplier.name} is now verified.`);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to approve.');
            } finally {
              setApproving(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.name || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.meta}>{item.total_listings} listings · Joined {item.joined_date}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.approveBtn, approving === item.id && { opacity: 0.6 }]}
        onPress={() => handleApprove(item)}
        disabled={approving === item.id}
      >
        {approving === item.id
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.approveBtnText}>Approve</Text>
        }
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Pending Verifications</Text>
          <Text style={styles.headerSub}>{requests.length} request{requests.length !== 1 ? 's' : ''} pending</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textLight} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchRequests}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, requests.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="shield-checkmark-outline" size={52} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Pending Requests</Text>
              <Text style={styles.emptySubTitle}>All verification requests have been processed.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingBottom: 18,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontFamily: fonts.semiBold },
  headerSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: fonts.regular, marginTop: 1 },

  list:      { padding: spacing.md, gap: 12 },
  listEmpty: { flex: 1 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: `${colors.primary}30`,
  },
  avatarText: { fontSize: 18, fontFamily: fonts.bold, color: colors.primary },
  info: { flex: 1 },
  name:  { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  email: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  meta:  { fontSize: 11, fontFamily: fonts.regular, color: colors.textLight, marginTop: 2 },

  approveBtn: {
    backgroundColor: '#10B981',
    borderRadius: radii.lg,
    paddingHorizontal: 16, paddingVertical: 9,
    minWidth: 80, alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontSize: 13, fontFamily: fonts.semiBold },

  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: spacing.lg },
  errorText:  { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  retryBtn:   { backgroundColor: colors.primary, borderRadius: radii.lg, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  retryText:  { color: '#fff', fontFamily: fonts.semiBold, fontSize: 14 },
  emptyTitle:    { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text },
  emptySubTitle: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
});
