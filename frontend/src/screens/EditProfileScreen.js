/**
 * EditProfileScreen.js
 *
 * Edit profile for both shopkeepers and suppliers.
 * Route name: EditProfile
 * Accessible from: AccountSettingsScreen profile card, SupplierAccountScreen pencil + Business Profile
 * API:
 *   PATCH /api/users/profile/         — accepts { name, phone_number, profile_image_url }
 *   POST  /api/users/profile/image/   — uploads profile photo, returns { imageUrl }
 *
 * On save: updates UserContext so the name change is reflected everywhere instantly.
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { updateProfile, uploadProfileImage } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { user, role, idToken, sessionId, refreshToken, updateUser } = useUser();

  const [name, setName]               = useState(user?.name || '');
  const [phone, setPhone]             = useState(user?.phone_number || '');
  const [profileImageUri, setProfileImageUri] = useState(user?.profile_image_url || '');
  const [saving, setSaving]           = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError]             = useState(null);
  const [saved, setSaved]             = useState(false);

  const isSupplier = role === 'SUPPLIER' || role === 'supplier';
  const roleLabel  = isSupplier ? 'Supplier' : 'Shopkeeper';

  const isDirty =
    name.trim() !== (user?.name || '').trim() ||
    phone.trim() !== (user?.phone_number || '').trim() ||
    profileImageUri !== (user?.profile_image_url || '');

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Allow photo access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploadingImage(true);
    try {
      const ext  = asset.uri.split('.').pop() || 'jpg';
      const data = await uploadProfileImage(
        { uri: asset.uri, name: `photo.${ext}`, type: `image/${ext}` },
        { idToken, sessionId },
      );
      setProfileImageUri(data.imageUrl);
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Name cannot be empty.'); return; }
    if (!isDirty) { navigation.goBack(); return; }

    setSaving(true);
    setError(null);
    try {
      const payload = { name: trimmedName };
      if (phone.trim() !== (user?.phone_number || '').trim()) payload.phone_number = phone.trim();
      if (profileImageUri !== (user?.profile_image_url || '')) payload.profile_image_url = profileImageUri;

      await updateProfile(payload, authArgs);
      await updateUser({ name: trimmedName, phone_number: phone.trim(), profile_image_url: profileImageUri });
      setSaved(true);
      setTimeout(() => navigation.goBack(), 600);
    } catch (err) {
      setError(err.message || 'Failed to save changes. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || user?.name || 'U').charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || !isDirty} style={styles.saveBtn}>
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={[styles.saveBtnText, !isDirty && styles.saveBtnDisabled]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrap} disabled={uploadingImage}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              {uploadingImage
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
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
                returnKeyType="next"
              />
            </View>

            <View style={[styles.field, styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={(t) => { setPhone(t); setSaved(false); }}
                placeholder="e.g. 0300-1234567"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>

            {/* Email — read-only */}
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

        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {saved && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.green} />
            <Text style={styles.successText}>Profile updated successfully</Text>
          </View>
        )}

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

const makeStyles = (colors) => StyleSheet.create({
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

  avatarSection:   { alignItems: 'center', paddingVertical: 24 },
  avatarWrap:      { position: 'relative', marginBottom: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarImage:     { width: 80, height: 80, borderRadius: 40 },
  avatarInitials:  { color: '#fff', fontSize: 30, fontFamily: fonts.bold },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  changePhotoText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary, marginBottom: 4 },
  roleLabel:       { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },

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
