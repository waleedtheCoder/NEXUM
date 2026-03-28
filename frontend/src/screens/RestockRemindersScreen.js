/**
 * RestockRemindersScreen.js
 *
 * Set and manage restock reminders for frequently ordered products.
 * Route name: RestockReminders
 * Accessible from: AccountSettingsScreen → Restock Reminders
 *
 * Storage: AsyncStorage (local only — no backend for this feature yet).
 * Each reminder: { id, product, quantity, unit, active }
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, Alert, Modal, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, spacing, radii, shadows } from '../constants/theme';

const STORAGE_KEY = 'nexum_restock_reminders';

const UNITS = ['kg', 'bags', 'boxes', 'cartons', 'pieces', 'liters', 'bottles'];

const SUGGESTIONS = [
  'Basmati Rice', 'Wheat Flour', 'Sugar', 'Cooking Oil', 'Salt',
  'Lentils', 'Chickpeas', 'Tea', 'Biscuits', 'Soap',
];

export default function RestockRemindersScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();

  const [reminders, setReminders]     = useState([]);
  const [modalOpen, setModalOpen]     = useState(false);
  const [product, setProduct]         = useState('');
  const [quantity, setQuantity]       = useState('');
  const [unit, setUnit]               = useState('kg');
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setReminders(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const persist = async (updated) => {
    setReminders(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleAdd = () => {
    const trimProduct  = product.trim();
    const trimQty      = quantity.trim();
    if (!trimProduct) { Alert.alert('Required', 'Enter a product name.'); return; }
    if (!trimQty || isNaN(Number(trimQty)) || Number(trimQty) <= 0) {
      Alert.alert('Required', 'Enter a valid quantity.');
      return;
    }
    const newReminder = {
      id:       `r-${Date.now()}`,
      product:  trimProduct,
      quantity: trimQty,
      unit,
      active:   true,
    };
    persist([newReminder, ...reminders]);
    setProduct('');
    setQuantity('');
    setUnit('kg');
    setModalOpen(false);
  };

  const handleToggle = (id) => {
    persist(reminders.map((r) => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Reminder', 'Remove this restock reminder?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => persist(reminders.filter((r) => r.id !== id)) },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.active && styles.cardInactive]}>
      <View style={[styles.cardIcon, { backgroundColor: item.active ? `${colors.primary}18` : colors.border }]}>
        <Ionicons
          name="repeat-outline"
          size={20}
          color={item.active ? colors.primary : colors.textLight}
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardProduct, !item.active && styles.textMuted]}>{item.product}</Text>
        <Text style={styles.cardQty}>
          Remind when below {item.quantity} {item.unit}
        </Text>
      </View>
      <Switch
        value={item.active}
        onValueChange={() => handleToggle(item.id)}
        trackColor={{ false: colors.border, true: `${colors.primary}60` }}
        thumbColor={item.active ? colors.primary : '#fff'}
        style={{ marginRight: 8 }}
      />
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Restock Reminders</Text>
        <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="repeat-outline" size={52} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptySub}>
              Add reminders for products you frequently restock so you never run out.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalOpen(true)}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Add First Reminder</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          reminders.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {reminders.filter((r) => r.active).length} active · {reminders.length} total
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(true)} style={styles.addInlineBtn}>
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={styles.addInlineBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Add reminder modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setModalOpen(false)}
        />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Reminder</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Product name */}
          <Text style={styles.inputLabel}>Product Name</Text>
          <TextInput
            style={styles.textInput}
            value={product}
            onChangeText={setProduct}
            placeholder="e.g. Basmati Rice"
            placeholderTextColor={colors.textLight}
            autoCorrect={false}
          />

          {/* Suggestions */}
          <View style={styles.suggestions}>
            {SUGGESTIONS.filter((s) => !reminders.some((r) => r.product === s)).slice(0, 5).map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.chip}
                onPress={() => setProduct(s)}
              >
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quantity + unit */}
          <Text style={styles.inputLabel}>Remind when stock falls below</Text>
          <View style={styles.qtyRow}>
            <TextInput
              style={[styles.textInput, styles.qtyInput]}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="50"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.unitSelector}
              onPress={() => setShowUnitPicker(!showUnitPicker)}
            >
              <Text style={styles.unitText}>{unit}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Unit picker */}
          {showUnitPicker && (
            <View style={styles.unitPicker}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitOption, u === unit && styles.unitOptionActive]}
                  onPress={() => { setUnit(u); setShowUnitPicker(false); }}
                >
                  <Text style={[styles.unitOptionText, u === unit && styles.unitOptionTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add Reminder</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: 14,
  },
  backBtn:     { padding: 4, marginRight: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: fonts.semiBold, color: '#fff', textAlign: 'center' },
  addBtn:      { padding: 4 },

  listContent: { padding: spacing.md, paddingBottom: 32, flexGrow: 1 },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderText:   { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  addInlineBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addInlineBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: colors.primary },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radii.xl,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    marginBottom: 10, ...shadows.sm,
  },
  cardInactive: { opacity: 0.55 },
  cardIcon:     { width: 38, height: 38, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  cardBody:     { flex: 1 },
  cardProduct:  { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 2 },
  cardQty:      { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary },
  textMuted:    { color: colors.textLight },
  deleteBtn:    { padding: 4 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  emptySub:   { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: colors.primary, borderRadius: radii.xl, paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle:   { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  inputLabel:   { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  textInput: {
    backgroundColor: colors.background, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: fonts.regular, color: colors.text,
    marginBottom: spacing.md,
  },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -8, marginBottom: spacing.md },
  chip: {
    backgroundColor: `${colors.primary}12`, borderRadius: radii.full,
    borderWidth: 1, borderColor: `${colors.primary}30`,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontFamily: fonts.medium, color: colors.primary },

  qtyRow: { flexDirection: 'row', gap: 10 },
  qtyInput: { flex: 1, marginBottom: 0 },
  unitSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.background, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: spacing.md,
  },
  unitText: { fontSize: 15, fontFamily: fonts.regular, color: colors.text },

  unitPicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: -8, marginBottom: spacing.md,
  },
  unitOption: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  unitOptionActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  unitOptionText:       { fontSize: 13, fontFamily: fonts.medium, color: colors.textSecondary },
  unitOptionTextActive: { color: '#fff' },

  addButton: {
    backgroundColor: colors.primary, borderRadius: radii.xl,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  addButtonText: { color: '#fff', fontSize: 15, fontFamily: fonts.semiBold },
});