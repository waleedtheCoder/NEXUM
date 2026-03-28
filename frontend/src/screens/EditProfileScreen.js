/**
 * EditProfileScreen.js
 *
 * Edit profile for both shopkeepers and suppliers.
 * Route name: EditProfile
 * Accessible from: AccountSettingsScreen profile card, SupplierAccountScreen pencil + Business Profile
 * API: PATCH /api/users/profile/  — accepts { name }
 *
 * On save: updates UserContext so the name change is reflected everywhere instantly.
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';
import { updateProfile } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { user, role, idToken, sessionId, refreshToken, updateUser } = useUser();

  const [name, setName]       = useState(user?.name || '');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [saved, setSaved]     = useState(false);

  const isSupplier    = role === 'SUPPLIER' || role === 'supplier';
  const roleLabel     = isSupplier ? 'Supplier' : 'Shopkeeper';
  const isDirty       = name.trim() !== (user?.name || '').trim();

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name cannot be empty.');
      return;
    }
    if (!isDirty) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: trimmed }, { idToken, sessionId, refreshToken, onTokenRefreshed: (t) => updateUser({ idToken: t }) });
      // Reflect change in context immediately so all screens see updated name
      await updateUser({ name: trimmed });
      setSaved(true);
      setTimeout(() => navigation.goBack(), 600);
    } catch (err) {
      setError(err.message || 'Failed to save changes. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !isDirty}
          style={styles.saveBtn}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={[styles.saveBtnText, (!isDirty) && styles.saveBtnDisabled]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>
              {(name || user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.roleLabel}>{roleLabel} Account</Text>
        </View>

        {/* Editable fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.fieldCard}>
            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={(t) => { setName(t); setError(null); setSaved(false); }}
                placeholder="Your full name"
                placeholderTextColor={colors.textLight}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            {/* Email — read-only (managed by Firebase, can't change here) */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.fieldReadOnly}>
                <Text style={styles.fieldReadOnlyText}>{user?.email || '—'}</Text>
                <View style={styles.lockedBadge}>
                  <Ionicons name="lock-closed" size={10} color={colors.textLight} />
                  <Text style={styles.lockedText}>Managed by Firebase</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Account details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.fieldCard}>
            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>Account Type</Text>
              <Text style={styles.fieldValue}>{roleLabel}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email Verified</Text>
              <View style={styles.verifiedRow}>
                <Ionicons
                  name={user?.email_verified ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={user?.email_verified ? colors.green : colors.accent}
                />
                <Text style={[styles.fieldValue, { color: user?.email_verified ? colors.green : colors.accent }]}>
                  {user?.email_verified ? 'Verified' : 'Not verified'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Success */}
        {saved && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.green} />
            <Text style={styles.successText}>Profile updated successfully</Text>
          </View>
        )}

        {/* Save button (bottom) */}
        <TouchableOpacity
          style={[styles.saveButtonLarge, (!isDirty || saving) && styles.saveButtonLargeDisabled]}
          onPress={handleSave}
          disabled={saving || !isDirty}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveButtonLargeText}>Save Changes</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: 14,
  },
  backBtn:         { padding: 4, marginRight: 4 },
  headerTitle:     { flex: 1, fontSize: 18, fontFamily: fonts.semiBold, color: '#fff', textAlign: 'center' },
  saveBtn:         { padding: 4, minWidth: 44, alignItems: 'flex-end' },
  saveBtnText:     { fontSize: 15, fontFamily: fonts.semiBold, color: '#fff' },
  saveBtnDisabled: { color: 'rgba(255,255,255,0.4)' },

  scroll: { padding: spacing.md, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitials: { color: '#fff', fontSize: 28, fontFamily: fonts.bold },
  roleLabel:      { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },

  section:      { marginBottom: spacing.md },
  sectionTitle: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  fieldCard:   { backgroundColor: colors.surface, borderRadius: radii.xl, overflow: 'hidden', ...shadows.sm },
  field:       { paddingHorizontal: spacing.md, paddingVertical: 14 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLabel:  { fontSize: 11, fontFamily: fonts.medium, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  fieldInput:  { fontSize: 15, fontFamily: fonts.regular, color: colors.text, padding: 0 },
  fieldValue:  { fontSize: 15, fontFamily: fonts.regular, color: colors.text },

  fieldReadOnly:     { gap: 4 },
  fieldReadOnlyText: { fontSize: 15, fontFamily: fonts.regular, color: colors.textSecondary },
  lockedBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  lockedText:        { fontSize: 11, fontFamily: fonts.regular, color: colors.textLight },

  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: radii.lg, borderWidth: 1, borderColor: '#FECACA',
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: spacing.md,
  },
  errorText: { fontSize: 13, fontFamily: fonts.medium, color: '#EF4444', flex: 1 },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: radii.lg, borderWidth: 1, borderColor: '#BBF7D0',
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: spacing.md,
  },
  successText: { fontSize: 13, fontFamily: fonts.medium, color: colors.green, flex: 1 },

  saveButtonLarge: {
    backgroundColor: colors.primary, borderRadius: radii.xl,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  saveButtonLargeDisabled: { backgroundColor: colors.border },
  saveButtonLargeText:     { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
});