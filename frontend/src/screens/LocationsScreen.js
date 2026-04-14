import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { useUser } from '../context/UserContext';

const CITIES = ['Lahore', 'Islamabad', 'Karachi', 'Quetta', 'Peshawar', 'Faisalabad', 'Bahawalpur', 'Sialkot', 'Gujranwala', 'Sargodha'];

export default function LocationsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { role } = useUser();
  const isSupplier = role === 'supplier' || role === 'SUPPLIER';
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');

  const filtered = CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  const toggle = (city) => {
    setSelected((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);
  };

  const handleContinue = async () => {
    if (selected.length) await AsyncStorage.setItem('selected_locations', JSON.stringify(selected));
    navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.locations.title}</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.locations.searchPlaceholder}
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {filtered.map((city) => (
          <TouchableOpacity
            key={city}
            style={[styles.cityChip, selected.includes(city) && styles.cityChipSelected]}
            onPress={() => toggle(city)}
          >
            {selected.includes(city) && <Ionicons name="checkmark" size={14} color={colors.primary} />}
            <Text style={[styles.cityText, selected.includes(city) && styles.cityTextSelected]}>{city}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!isSupplier && (
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] })}>
            <Text style={styles.skipText}>{t.locations.skip}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.continueBtn, isSupplier && styles.continueBtnFull]} onPress={handleContinue}>
          <Text style={styles.continueText}>{t.locations.continue}{selected.length ? ` (${selected.length})` : ''}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: 12, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: spacing.md, backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 4 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing.md, paddingBottom: 16 },
  cityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cityChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  cityText: { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
  cityTextSelected: { color: colors.primary },
  footer: { flexDirection: 'row', gap: 12, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  skipBtn: { flex: 1, paddingVertical: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  skipText: { fontSize: 15, fontFamily: fonts.medium, color: colors.textSecondary },
  continueBtn: { flex: 2, paddingVertical: 14, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: '#0a524d', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.35)' },
  continueBtnFull: { flex: 1 },
  continueText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#fff' },
});
