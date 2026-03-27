import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, spacing, radii } from '../constants/theme';
import { createListing, updateListing } from '../services/marketplaceApi';
import { useUser } from '../context/UserContext';

const UNITS = ['kg', 'liters', 'pieces', 'boxes', 'cartons', 'bags', 'bottles'];
const CONDITIONS = ['New', 'Bulk Wholesale', 'Clearance Stock'];

export default function CreateListingScreen() {
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
  const [condition, setCondition] = useState(existing?.condition || 'Bulk Wholesale');
  const [location, setLocation] = useState(existing?.location || '');
  const [loading, setLoading] = useState(false);

  const authArgs = {
    idToken, sessionId, refreshToken,
    onTokenRefreshed: (t) => updateUser({ idToken: t }),
  };

  const validate = () => {
    if (!productName.trim()) { Alert.alert('Required', 'Please enter a product name.'); return false; }
    if (!price.trim() || isNaN(parseFloat(price))) { Alert.alert('Required', 'Please enter a valid price.'); return false; }
    if (!quantity.trim() || isNaN(parseInt(quantity))) { Alert.alert('Required', 'Please enter a valid quantity.'); return false; }
    if (!location.trim()) { Alert.alert('Required', 'Please enter a location.'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const payload = {
      productName: productName.trim(),
      description: description.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      unit,
      condition,
      location: location.trim(),
      category,
    };

    try {
      if (editMode && existing?.id) {
        await updateListing(existing.id, payload, authArgs);
        Alert.alert('Updated!', 'Your listing has been updated.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createListing(payload, authArgs);
        Alert.alert(
          'Listing Submitted!',
          `Your listing for "${productName}" has been submitted for review. It will go live after approval.`,
          [{ text: 'View My Listings', onPress: () => navigation.navigate('MyListings') }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title={editMode ? 'Edit Listing' : 'Create Listing'} showBack />

      <ScrollView
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
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photo upload placeholder */}
        <View style={styles.photoSection}>
          <Text style={styles.label}>Product Photos</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoAddBtn}>
              <Ionicons name="camera-outline" size={28} color={colors.primary} />
              <Text style={styles.photoAddText}>Add Photo</Text>
            </TouchableOpacity>
            <View style={styles.photoHint}>
              <Text style={styles.photoHintText}>Add up to 5 photos.</Text>
              <Text style={styles.photoHintText}>First photo is the cover.</Text>
            </View>
          </View>
        </View>

        {/* Product Name */}
        <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Premium Basmati Rice 25kg"
          placeholderTextColor={colors.textLight}
          value={productName}
          onChangeText={setProductName}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe your product, quality, brand, minimum order, etc."
          placeholderTextColor={colors.textLight}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Price & Quantity */}
        <View style={styles.row2}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Price (Rs) <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 8800"
              placeholderTextColor={colors.textLight}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Quantity <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor={colors.textLight}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Unit selector */}
        <Text style={styles.label}>Unit</Text>
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
        <Text style={styles.label}>Condition</Text>
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

        {/* Location */}
        <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lahore Wholesale Market"
          placeholderTextColor={colors.textLight}
          value={location}
          onChangeText={setLocation}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.submitText}>
                {editMode ? 'Save Changes' : 'Post Listing'}
              </Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 40 },

  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: `${colors.primary}18`, borderRadius: radii.lg,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: spacing.md,
  },
  categoryText: { flex: 1, fontSize: 13, fontFamily: fonts.medium, color: colors.primary },
  changeText: { fontSize: 12, fontFamily: fonts.medium, color: colors.accent },

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

  label: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 6 },
  required: { color: colors.accent },
  input: {
    backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular,
    color: colors.text, marginBottom: spacing.md,
  },
  textarea: { height: 100 },
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },

  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}18` },
  chipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  chipTextActive: { color: colors.primary },

  submitBtn: {
    backgroundColor: colors.primary, borderRadius: radii.xl,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.md,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontFamily: fonts.semiBold },
});
