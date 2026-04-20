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

const MAX_IMAGES = 5;

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
  // images: [{ id, uri, url, uploading }]
  //   id        — client-side unique key
  //   uri       — local file URI (shown as preview)
  //   url       — remote Supabase URL (null until upload completes)
  //   uploading — true while upload is in-flight
  const buildInitialImages = () => {
    const urls = existing?.imageUrls?.length ? existing.imageUrls
      : existing?.imageUrl ? [existing.imageUrl]
      : [];
    return urls.map((u, i) => ({ id: `existing-${i}`, uri: u, url: u, uploading: false }));
  };
  const [images, setImages] = useState(buildInitialImages);

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

  // ── Pick and upload images ────────────────────────────────────────────────
  const handlePickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can upload up to ${MAX_IMAGES} photos.`);
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.createListing.permRequired, t.createListing.permMsg);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - images.length,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const newEntries = result.assets.map((asset) => ({
        id: `pick-${Date.now()}-${Math.random()}`,
        uri: asset.uri,
        url: null,
        uploading: true,
      }));

      setImages((prev) => [...prev, ...newEntries]);

      // Upload each picked asset in parallel
      await Promise.all(
        newEntries.map(async (entry) => {
          try {
            const filename = entry.uri.split('/').pop();
            const ext = filename.split('.').pop().toLowerCase();
            const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
            const mime = mimeMap[ext] || 'image/jpeg';
            const uploaded = await uploadListingImage(
              { uri: entry.uri, name: filename, type: mime },
              { idToken, sessionId },
            );
            setImages((prev) =>
              prev.map((img) => img.id === entry.id ? { ...img, url: uploaded.imageUrl, uploading: false } : img)
            );
          } catch (err) {
            Alert.alert(t.createListing.uploadFailed, err.message || t.createListing.uploadFailedMsg);
            setImages((prev) => prev.filter((img) => img.id !== entry.id));
          }
        })
      );
    } catch (err) {
      Alert.alert(t.createListing.permRequired, t.createListing.cantOpenLibrary);
    }
  };

  const handleRemoveImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const isUploading = images.some((img) => img.uploading);

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    if (!productName.trim()) { Alert.alert(t.createListing.required, t.createListing.enterProductName); return false; }
    if (!price.trim() || isNaN(parseFloat(price))) { Alert.alert(t.createListing.required, t.createListing.enterValidPrice); return false; }
    if (!quantity.trim() || isNaN(parseInt(quantity))) { Alert.alert(t.createListing.required, t.createListing.enterValidQty); return false; }
    if (cities.length === 0) { Alert.alert(t.createListing.required, 'Select at least one delivery city.'); return false; }
    if (isUploading) {
      Alert.alert(t.createListing.imageUploading, t.createListing.imageUploadingMsg);
      return false;
    }
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const imageUrls = images.map((img) => img.url).filter(Boolean);
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
      ...(imageUrls.length ? { imageUrls, imageUrl: imageUrls[0] } : {}),
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
          <View style={styles.photoLabelRow}>
            <Text style={styles.label}>{t.createListing.productPhoto}</Text>
            <Text style={styles.photoCount}>{images.length}/{MAX_IMAGES}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photoStrip}>
              {images.map((img) => (
                <View key={img.id} style={styles.thumbWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />
                  {img.uploading ? (
                    <View style={styles.thumbOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.thumbRemoveBtn} onPress={() => handleRemoveImage(img.id)}>
                      <Ionicons name="close-circle" size={22} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {!img.uploading && img.url && (
                    <View style={styles.thumbDone}>
                      <Ionicons name="checkmark-circle" size={14} color="#fff" />
                    </View>
                  )}
                </View>
              ))}

              {images.length < MAX_IMAGES && (
                <TouchableOpacity style={styles.photoAddBtn} onPress={handlePickImage}>
                  <Ionicons name="camera-outline" size={26} color={colors.primary} />
                  <Text style={styles.photoAddText}>
                    {images.length === 0 ? t.createListing.addPhoto : 'Add More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {images.length === 0 && (
            <Text style={styles.photoHintText}>{t.createListing.tapToChoose} · {t.createListing.fileTypes}</Text>
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
        <Text style={styles.label}>Delivery Cities</Text>
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
          style={[styles.submitBtn, (loading || isUploading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || isUploading}
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
  photoLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  photoCount: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  photoStrip: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 },
  photoAddBtn: {
    width: 86, height: 86, borderRadius: radii.xl,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  photoAddText: { fontSize: 10, fontFamily: fonts.medium, color: colors.primary, textAlign: 'center' },
  photoHintText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 6 },

  // Image thumbnails
  thumbWrapper: {
    width: 86, height: 86, borderRadius: radii.xl, overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  thumb: { width: '100%', height: '100%' },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
    alignItems: 'center', justifyContent: 'center',
  },
  thumbRemoveBtn: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 11,
  },
  thumbDone: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: 7,
    padding: 1,
  },

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