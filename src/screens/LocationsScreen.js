import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, spacing, radii } from '../constants/theme';

const CITIES = ['Lahore', 'Islamabad', 'Karachi', 'Quetta', 'Peshawar', 'Faisalabad', 'Bahawalpur', 'Sialkot', 'Gujranwala', 'Sargodha'];

export default function LocationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');

  const filtered = CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  const toggle = (city) => {
    setSelected((prev) => prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]);
  };

  const handleContinue = async () => {
    if (selected.length) await AsyncStorage.setItem('selected_locations', JSON.stringify(selected));
    navigation.navigate('LoginSignupOption');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Select your city</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search cities..."
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
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
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('LoginSignupOption')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueText}>Continue{selected.length ? ` (${selected.length})` : ''}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: 12, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: spacing.md, backgroundColor: colors.background, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing.md, paddingBottom: 16 },
  cityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cityChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  cityText: { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
  cityTextSelected: { color: colors.primary },
  footer: { flexDirection: 'row', gap: 12, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  skipBtn: { flex: 1, paddingVertical: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  skipText: { fontSize: 15, fontFamily: fonts.medium, color: colors.textSecondary },
  continueBtn: { flex: 2, paddingVertical: 14, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center' },
  continueText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#fff' },
});
