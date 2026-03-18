import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';

const UNITS = ['kg', 'liters', 'pieces', 'boxes', 'cartons', 'bags', 'bottles'];
const CONDITIONS = ['New', 'Bulk Wholesale', 'Clearance Stock'];

export default function CreateListingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const category = route.params?.category || 'General';

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('kg');
  const [selectedCondition, setSelectedCondition] = useState('New');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = productName.trim() && price.trim() && quantity.trim() && location.trim();

  const handlePost = () => {
    if (!isValid) {
      Alert.alert('Missing Fields', 'Please fill in product name, price, quantity, and location.');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Listing Posted!',
        `Your listing for "${productName}" has been submitted for review.`,
        [{ text: 'View My Listings', onPress: () => navigation.navigate('MyListings') }]
      );
    }, 1200);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScreenHeader title="Create Listing" showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Category badge */}
        <View style={styles.categoryRow}>
          <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
          <Text style={styles.categoryText}>{category}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
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

        {/* Price & Quantity row */}
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

        {/* Unit selection */}
        <Text style={styles.label}>Unit</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.chip, selectedUnit === u && styles.chipActive]}
              onPress={() => setSelectedUnit(u)}
            >
              <Text style={[styles.chipText, selectedUnit === u && styles.chipTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Condition */}
        <Text style={styles.label}>Condition</Text>
        <View style={styles.conditionRow}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.conditionBtn, selectedCondition === c && styles.conditionBtnActive]}
              onPress={() => setSelectedCondition(c)}
            >
              <Text style={[styles.conditionText, selectedCondition === c && styles.conditionTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputRow}>
          <Ionicons name="location-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.inputWithIcon]}
            placeholder="e.g. Lahore Wholesale Market"
            placeholderTextColor={colors.textLight}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Price preview */}
        {price && quantity ? (
          <View style={styles.previewCard}>
            <Ionicons name="calculator-outline" size={18} color={colors.primary} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewLabel}>Total Stock Value</Text>
              <Text style={styles.previewValue}>
                Rs {(parseFloat(price || 0) * parseFloat(quantity || 0)).toLocaleString()}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Post button */}
        <TouchableOpacity
          style={[styles.postBtn, (!isValid || loading) && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!isValid || loading}
        >
          {loading ? (
            <Text style={styles.postBtnText}>Submitting...</Text>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.postBtnText}>Post Listing</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Your listing will be reviewed and go live within a few minutes.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 32 },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, borderRadius: radii.full,
    paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  categoryText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary, flex: 1 },
  changeText: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.accent },
  photoSection: { marginBottom: spacing.md },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 },
  photoAddBtn: {
    width: 90, height: 90, borderRadius: radii.lg,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.primaryLight,
  },
  photoAddText: { fontSize: 10, fontFamily: fonts.medium, color: colors.primary },
  photoHint: { flex: 1 },
  photoHintText: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 18 },
  label: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 6, marginTop: 14 },
  required: { color: colors.error },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: fonts.regular, color: colors.text,
  },
  textarea: { minHeight: 90, paddingTop: 12 },
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  chipScroll: { marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  conditionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  conditionBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  conditionBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  conditionText: { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  conditionTextActive: { color: colors.primary },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 12, zIndex: 1 },
  inputWithIcon: { flex: 1, paddingLeft: 38 },
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primaryLight, borderRadius: radii.md, padding: 14,
    marginTop: spacing.md, borderWidth: 1, borderColor: 'rgba(15,118,110,0.2)',
  },
  previewInfo: { flex: 1 },
  previewLabel: { fontSize: 12, fontFamily: fonts.regular, color: colors.primary },
  previewValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.primary },
  postBtn: {
    backgroundColor: colors.accent, borderRadius: radii.lg,
    paddingVertical: 15, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8, marginTop: spacing.xl, ...shadows.md,
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
  disclaimer: {
    textAlign: 'center', fontSize: 11, fontFamily: fonts.regular,
    color: colors.textSecondary, marginTop: 10, lineHeight: 18,
  },
});
