import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../context/UserContext';
import { CITIES } from '../constants/cities';

export default function ShopkeeperCityScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { setShopkeeperCity } = useUser();

  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  const filtered = CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  const handleContinue = async () => {
    if (!selected) return;
    await setShopkeeperCity(selected);
    navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Select Your City</Text>
          <Text style={styles.subtitle}>Products near you will be shown first</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search city..."
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.map((city) => {
          const isSelected = selected === city;
          return (
            <TouchableOpacity
              key={city}
              style={[styles.cityChip, isSelected && styles.cityChipSelected]}
              onPress={() => setSelected(city)}
            >
              {isSelected
                ? <Ionicons name="radio-button-on" size={16} color={colors.primary} />
                : <Ionicons name="radio-button-off" size={16} color={colors.textSecondary} />
              }
              <Text style={[styles.cityText, isSelected && styles.cityTextSelected]}>
                {city}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.continueText}>
            {selected ? `Continue with ${selected}` : 'Select a city to continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: 12, gap: 12 },
  backBtn:          { padding: 4 },
  title:            { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text },
  subtitle:         { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
  searchWrap:       { flexDirection: 'row', alignItems: 'center', gap: 8, margin: spacing.md, backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 4 },
  searchInput:      { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  grid:             { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing.md, paddingBottom: 16 },
  cityChip:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.full, backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cityChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  cityText:         { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
  cityTextSelected: { color: colors.primary },
  footer:           { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  continueBtn:      { paddingVertical: 14, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: '#0a524d', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.35)' },
  continueBtnDisabled: { backgroundColor: colors.textLight, borderBottomColor: colors.border, borderTopColor: 'transparent' },
  continueText:     { fontSize: 15, fontFamily: fonts.semiBold, color: '#fff' },
});
