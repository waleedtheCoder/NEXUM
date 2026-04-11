import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ProgressIndicator from '../components/ProgressIndicator';
import PressableBounce from '../components/PressableBounce';
import BubblyButton from '../components/BubblyButton';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';
import { fonts, spacing, radii } from '../constants/theme';

export default function RoleSelectionScreen() {
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ProgressIndicator totalSteps={3} currentStep={1} />
      <View style={styles.body}>
        <Text style={styles.heading}>Are you a shopkeeper or supplier?</Text>
        <View style={styles.options}>
          {['shopkeeper', 'supplier'].map((role) => (
            <PressableBounce
              key={role}
              style={[styles.option, selected === role && styles.optionSelected]}
              onPress={() => setSelected(role)}
            >
              <Text style={[styles.optionText, selected === role && styles.optionTextSelected]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </PressableBounce>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <PressableBounce style={styles.skipBtn} onPress={() => navigation.navigate('Locations')}>
          <Text style={styles.skipText}>Skip</Text>
        </PressableBounce>
        <BubblyButton
          label="Next"
          onPress={handleNext}
          variant="primary"
          colors={colors}
          style={styles.nextBtnOverride}
        />
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
    flex: 1, paddingVertical: 24, borderRadius: radii.xl,
    alignItems: 'center', backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOpacity: 0.20,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.6)',
  },
  optionText: { fontSize: 16, fontFamily: fonts.medium, color: colors.textSecondary },
  optionTextSelected: { color: colors.primary, fontFamily: fonts.semiBold },
  footer: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  skipBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radii.lg,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
    backgroundColor: colors.surface,
  },
  skipText: { fontSize: 15, fontFamily: fonts.medium, color: colors.textSecondary },
  nextBtnOverride: { flex: 2 },
});
