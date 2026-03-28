import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ProgressIndicator from '../components/ProgressIndicator';
import { useUser } from '../context/UserContext';
import { fonts, spacing, radii, shadows } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function ShopkeeperSupplierScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { setUserRole } = useUser();
  const [selected, setSelected] = useState('shopkeeper');

  const handleNext = async () => {
    await setUserRole(selected);
    navigation.navigate('Locations');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ProgressIndicator totalSteps={3} currentStep={1} />
      <View style={styles.body}>
        <Text style={styles.heading}>Are you a shopkeeper or supplier?</Text>
        <View style={styles.options}>
          {['shopkeeper', 'supplier'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.option, selected === role && styles.optionSelected]}
              onPress={() => setSelected(role)}
            >
              <Text style={[styles.optionText, selected === role && styles.optionTextSelected]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('Locations')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  heading: { fontSize: 20, fontFamily: fonts.semiBold, color: colors.text, textAlign: 'center' },
  options: { flexDirection: 'row', gap: 16, width: '100%' },
  option: {
    flex: 1, paddingVertical: 20, borderRadius: radii.xl,
    borderWidth: 2, borderColor: colors.border, alignItems: 'center',
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionText: { fontSize: 16, fontFamily: fonts.medium, color: colors.textSecondary },
  optionTextSelected: { color: colors.primary },
  footer: { flexDirection: 'row', gap: 12 },
  skipBtn: { flex: 1, paddingVertical: 14, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  skipText: { fontSize: 15, fontFamily: fonts.medium, color: colors.textSecondary },
  nextBtn: { flex: 2, paddingVertical: 14, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center' },
  nextText: { fontSize: 15, fontFamily: fonts.semiBold, color: '#fff' },
});
