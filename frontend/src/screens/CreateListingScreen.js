import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import ScreenHeader from '../components/ScreenHeader';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { createListing, updateListing, uploadListingImage } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';
import { CITIES } from '../constants/cities';

const UNITS = ['kg', 'liters', 'pieces', 'boxes', 'cartons', 'bags', 'bottles'];
const CONDITIONS = ['New', 'Bulk Wholesale', 'Clearance Stock'];

export default function CreateListingScreen() {
  const { colors } = useTheme();
  const { t, isUrdu } = useLanguage();
    const styles = makeStyles(colors);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const category = route.params?.category || 'General';
  const editMode = route.params?.editMode || false;
  const existing = route.params?.existingListing;

  // ── Form state (pre-fill when editing) ──────────────────────────────────
  const [productName, setProductName] = useState(existing?.productName || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [price, setPrice] = useState(existing?.pricePerUnit ? String(existing.pricePerUnit) : '');
  const [quantity, setQuantity] = useState(existing?.quantity ? String(existing.quantity) : '');
  const [unit, setUnit] = useState(existing?.unit || 'kg');
  const [minOrderQty, setMinOrderQty] = useState(existing?.minOrderQty ? String(existing.minOrderQty) : '1');
  const [condition, setCondition] = useState(existing?.condition || 'Bulk Wholesale');
  const [cities, setCities] = useState(existing?.cities || []);
  const [cityQuery, setCityQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Image state ──────────────────────────────────────────────────────────
  // imageUri     — local URI shown as preview (picked from library)
  // imageUrl     — remote URL returned by the upload API (sent in payload)
  // uploading    — true while the POST /api/listings/upload-image/ is in flight
  const [imageUri, setImageUri]   = useState(existing?.imageUrl || null);
  const [imageUrl, setImageUrl]   = useState(existing?.imageUrl || null);
  const [uploading, setUploading] = useState(false);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  // ── Request camera-roll permission on mount ──────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        // Don't block — just means the picker button will request again when tapped
        console.log('Media library permission not granted yet.');
      }
    })();
  }, []);

  // ── Pick image from device library ──────────────────────────────────────
  const handlePickImage = async () => {
    try {
      // Re-request in case user denied initially
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t.createListing.permRequired,
          t.createListing.permMsg,
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      // Show local preview immediately — don't wait for upload
      setImageUri(asset.uri);
      setImageUrl(null); // reset remote URL until upload completes

      // Upload to backend
      setUploading(true);
      try {
        const filename = asset.uri.split('/').pop();
        const ext = filename.split('.').pop().toLowerCase();
        const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
        const mime = mimeMap[ext] || 'image/jpeg';

        const uploaded = await uploadListingImage(
          { uri: asset.uri, name: filename, type: mime },
          { idToken, sessionId },
        );
        setImageUrl(uploaded.imageUrl);
      } catch (err) {
        Alert.alert(t.createListing.uploadFailed, err.message || t.createListing.uploadFailedMsg);
        // Keep local preview but clear remote URL so submit won't use a broken link
        setImageUrl(null);
      } finally {
        setUploading(false);
      }
    } catch (err) {
      Alert.alert(t.createListing.permRequired, t.createListing.cantOpenLibrary);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setImageUrl(null);
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    if (!productName.trim()) { Alert.alert(t.createListing.required, t.createListing.enterProductName); return false; }
    if (!price.trim() || isNaN(parseFloat(price))) { Alert.alert(t.createListing.required, t.createListing.enterValidPrice); return false; }
    if (!quantity.trim() || isNaN(parseInt(quantity))) { Alert.alert(t.createListing.required, t.createListing.enterValidQty); return false; }
    if (cities.length === 0) { Alert.alert(t.createListing.required, 'Select at least one delivery city.'); return false; }
    if (imageUri && !imageUrl) {
      Alert.alert(t.createListing.imageUploading, t.createListing.imageUploadingMsg);
      return false;
    }
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const payload = {
      productName: productName.trim(),
      description: description.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      unit,
      minOrderQty: parseInt(minOrderQty, 10) || 1,
      condition,
      category,
      cities,
      // Only include imageUrl if one was successfully uploaded
      ...(imageUrl ? { imageUrl } : {}),
    };

    try {
      if (editMode && existing?.id) {
        await updateListing(existing.id, payload, authArgs);
        Alert.alert(t.createListing.updated, t.createListing.updatedMsg, [
          { text: t.common.confirm, onPress: () => navigation.goBack() },
        ]);
      } else {
        await createListing(payload, authArgs);
        Alert.alert(
          t.createListing.submitted,
          t.createListing.submittedMsg,
          [{ text: t.createListing.viewListings, onPress: () => navigation.navigate('Sell') }]
        );
      }
    } catch (err) {
      Alert.alert(t.createListing.required, err.message || t.common.comingSoon);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={editMode ? t.createListing.editTitle : t.createListing.title} showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Category badge */}
        <View style={styles.categoryRow}>
          <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
          <Text style={styles.categoryText}>{category}</Text>
          {!editMode && (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.changeText}>{t.createListing.change}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Photo upload ──────────────────────────────────────────────── */}
        <View style={styles.photoSection}>
          <Text style={styles.label}>{t.createListing.productPhoto}</Text>

          {imageUri ? (
            // Preview + remove button
            <View style={styles.previewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />

              {/* Upload progress overlay */}
              {uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.uploadingText}>{t.createListing.uploading}</Text>
                </View>
              )}

              {/* Remove button — top-right corner */}
              {!uploading && (
                <TouchableOpacity style={styles.removeBtn} onPress={handleRemoveImage}>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              )}

              {/* Success tick once uploaded */}
              {!uploading && imageUrl && (
                <View style={styles.successBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.successText}>{t.createListing.uploaded}</Text>
                </View>
              )}
            </View>
          ) : (
            // Empty state picker button
            <View style={styles.photoRow}>
              <TouchableOpacity style={styles.photoAddBtn} onPress={handlePickImage}>
                <Ionicons name="camera-outline" size={28} color={colors.primary} />
                <Text style={styles.photoAddText}>{t.createListing.addPhoto}</Text>
              </TouchableOpacity>
              <View style={styles.photoHint}>
                <Text style={styles.photoHintText}>{t.createListing.tapToChoose}</Text>
                <Text style={styles.photoHintText}>{t.createListing.fileTypes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Product Name */}
        <Text style={styles.label}>{t.createListing.productName} <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder={t.createListing.productNamePlaceholder}
          placeholderTextColor={colors.textLight}
          value={productName}
          onChangeText={setProductName}
        />

        {/* Description */}
        <Text style={styles.label}>{t.createListing.description}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={t.createListing.descPlaceholder}
          placeholderTextColor={colors.textLight}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        {/* Price & Quantity */}
        <View style={styles.row2}>
          <View style={styles.flex1}>
            <Text style={styles.label}>{t.createListing.price} <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder={t.createListing.pricePlaceholder}
              placeholderTextColor={colors.textLight}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>{t.createListing.quantity} <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder={t.createListing.qtyPlaceholder}
              placeholderTextColor={colors.textLight}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Min Order Qty */}
        <Text style={styles.label}>{t.createListing.minOrder}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.createListing.minOrderPlaceholder}
          placeholderTextColor={colors.textLight}
          value={minOrderQty}
          onChangeText={setMinOrderQty}
          keyboardType="numeric"
        />

        {/* Unit selector */}
        <Text style={styles.label}>{t.createListing.unit}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          <View style={styles.chipRow}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.chip, unit === u && styles.chipActive]}
                onPress={() => setUnit(u)}
              >
                <Text style={[styles.chipText, unit === u && styles.chipTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Condition selector */}
        <Text style={styles.label}>{t.createListing.condition}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          <View style={styles.chipRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, condition === c && styles.chipActive]}
                onPress={() => setCondition(c)}
              >
                <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Delivery Cities */}
        <Text style={styles.label}>
          Delivery Cities <Text style={styles.labelHint}>(select cities you deliver to)</Text>
        </Text>
        {cities.length > 0 && (
          <View style={styles.selectedCitiesRow}>
            {cities.map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.selectedCityChip}
                onPress={() => setCities((prev) => prev.filter((x) => x !== c))}
              >
                <Text style={styles.selectedCityText}>{c}</Text>
                <Ionicons name="close" size={12} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.citySearchWrap}>
          <Ionicons name="search" size={14} color={colors.textSecondary} />
          <TextInput
            style={styles.citySearchInput}
            placeholder="Search cities..."
            placeholderTextColor={colors.textLight}
            value={cityQuery}
            onChangeText={setCityQuery}
          />
        </View>
        <View style={styles.cityGrid}>
          {CITIES.filter((c) => c.toLowerCase().includes(cityQuery.toLowerCase())).map((c) => {
            const active = cities.includes(c);
            return (
              <TouchableOpacity
                key={c}
                style={[styles.cityChip, active && styles.cityChipActive]}
                onPress={() =>
                  setCities((prev) =>
                    prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                  )
                }
              >
                {active && <Ionicons name="checkmark" size={12} color={colors.primary} />}
                <Text style={[styles.cityChipText, active && styles.cityChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (loading || uploading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.submitText}>
                {editMode ? t.createListing.saveChanges : t.createListing.post}
              </Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 40 },

  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: `${colors.primary}18`, borderRadius: radii.lg,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: spacing.md,
  },
  categoryText: { flex: 1, fontSize: 13, fontFamily: fonts.medium, color: colors.primary },
  changeText: { fontSize: 12, fontFamily: fonts.medium, color: colors.accent },

  // Photo section
  photoSection: { marginBottom: spacing.md },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  photoAddBtn: {
    width: 90, height: 90, borderRadius: radii.xl,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  photoAddText: { fontSize: 11, fontFamily: fonts.medium, color: colors.primary },
  photoHint: { flex: 1 },
  photoHintText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 18 },

  // Image preview
  previewWrapper: {
    marginTop: 8, borderRadius: radii.xl, overflow: 'hidden',
    width: '100%', height: 180, backgroundColor: colors.surface,
  },
  previewImage: { width: '100%', height: '100%' },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  uploadingText: { color: '#fff', fontFamily: fonts.medium, fontSize: 13 },
  removeBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12,
  },
  successBadge: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: radii.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  successText: { color: '#fff', fontSize: 11, fontFamily: fonts.semiBold },

  label: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 6 },
  required: { color: colors.accent },
  input: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular,
    color: colors.text, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  textarea: { height: 100 },
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },

  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  chipActive: {
    backgroundColor: `${colors.primary}18`,
    shadowColor: colors.primary, shadowOpacity: 0.20,
  },
  chipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  chipTextActive: { color: colors.primary },

  labelHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },

  selectedCitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  selectedCityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radii.full, backgroundColor: `${colors.primary}18`,
    borderWidth: 1, borderColor: colors.primary,
  },
  selectedCityText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },

  citySearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radii.lg,
    paddingHorizontal: 12, paddingVertical: 9,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  citySearchInput: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: colors.text },

  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  cityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radii.full, backgroundColor: colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cityChipActive: { backgroundColor: `${colors.primary}18`, borderWidth: 1, borderColor: colors.primary },
  cityChipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  cityChipTextActive: { color: colors.primary },

  submitBtn: {
    backgroundColor: colors.primary, borderRadius: radii.xl,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.md,
    borderBottomWidth: 4, borderBottomColor: '#0a524d',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.35)',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontFamily: fonts.semiBold },
});