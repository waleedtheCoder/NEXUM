import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ProgressIndicator from '../components/ProgressIndicator';
import PressableBounce from '../components/PressableBounce';
import BubblyButton from '../components/BubblyButton';
import { useUser } from '../context/UserContext';
import { useTheme } from '../hooks/useTheme';
import { fonts, spacing, radii } from '../constants/theme';

const ROLES = [
  {
    value: 'shopkeeper',
    icon: 'storefront-outline',
    title: 'Shopkeeper',
    description: 'Browse suppliers, place bulk orders, and manage your inventory.',
  },
  {
    value: 'supplier',
    icon: 'cube-outline',
    title: 'Supplier',
    description: 'List your products, receive orders, and grow your wholesale business.',
  },
];

export default function RoleSelectionScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { setUserRole } = useUser();
  const [selected, setSelected] = useState('shopkeeper');

  const handleNext = async () => {
    await setUserRole(selected);
    navigation.navigate(selected === 'supplier' ? 'SupplierPhone' : 'Locations');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ProgressIndicator totalSteps={3} currentStep={1} />

      <View style={styles.body}>
        <View style={styles.headingWrap}>
          <Text style={styles.heading}>How will you use NEXUM?</Text>
          <Text style={styles.sub}>Choose your role to get started.</Text>
        </View>

        <View style={styles.options}>
          {ROLES.map((role) => {
            const active = selected === role.value;
            return (
              <PressableBounce
                key={role.value}
                style={[styles.card, active && styles.cardSelected]}
                onPress={() => setSelected(role.value)}
              >
                <View style={[styles.iconWrap, active && styles.iconWrapSelected]}>
                  <Ionicons
                    name={role.icon}
                    size={28}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, active && styles.cardTitleSelected]}>
                    {role.title}
                  </Text>
                  <Text style={styles.cardDesc}>{role.description}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioSelected]}>
                  {active && <View style={styles.radioDot} />}
                </View>
              </PressableBounce>
            );
          })}
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

  body: { flex: 1, justifyContent: 'center', gap: spacing.xl },

  headingWrap: { gap: 6 },
  heading: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  sub: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary },

  options: { gap: 14 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    elevation: 7,
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: `${colors.primary}22`,
  },

  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.textSecondary },
  cardTitleSelected: { color: colors.primary },
  cardDesc: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 17 },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  footer: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  skipBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radii.lg,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
    backgroundColor: colors.surface,
  },
  skipText: { fontSize: 15, fontFamily: fonts.medium, color: colors.textSecondary },
  nextBtnOverride: { flex: 2 },
});
