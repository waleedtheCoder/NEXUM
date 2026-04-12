import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, StatusBar, ActivityIndicator,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ProgressIndicator from '../components/ProgressIndicator';
import PressableBounce from '../components/PressableBounce';
import BubblyButton from '../components/BubblyButton';
import { fonts, spacing, radii } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../context/UserContext';
import { updateProfile } from '../services/marketplaceApi';

export default function SupplierPhoneScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { idToken, sessionId, refreshToken, updateUser } = useUser();

  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const goNext = () => navigation.navigate('Locations');

  const handleNext = async () => {
    const trimmed = phone.trim();
    if (!trimmed) { goNext(); return; }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile(
        { phone_number: trimmed },
        {
          idToken, sessionId, refreshToken,
          onTokenRefreshed: (t) => updateUser({ idToken: t }),
        }
      );
      updateUser({ phone_number: updated.phone_number ?? trimmed });
      goNext();
    } catch (err) {
      setError(err.message || 'Failed to save. Try again.');
      setSaving(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ProgressIndicator totalSteps={3} currentStep={2} />

      <View style={styles.body}>
        <Text style={styles.heading}>What's your business number?</Text>
        <Text style={styles.sub}>Customers will use this to contact you directly.</Text>

        <View style={[styles.inputWrap, error && styles.inputWrapError]}>
          <Text style={styles.flag}>🇵🇰 +92</Text>
          <TextInput
            style={styles.input}
            placeholder="3XX XXXXXXX"
            placeholderTextColor={colors.textLight}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => { setPhone(v); setError(null); }}
            maxLength={11}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.footer}>
        <PressableBounce style={styles.skipBtn} onPress={goNext}>
          <Text style={styles.skipText}>Skip</Text>
        </PressableBounce>
        <BubblyButton
          label={saving ? '' : 'Next'}
          onPress={handleNext}
          variant="primary"
          colors={colors}
          style={styles.nextBtnOverride}
          disabled={saving}
        >
          {saving && <ActivityIndicator color="#fff" size="small" />}
        </BubblyButton>
      </View>
    </View>
    </TouchableWithoutFeedback>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  body: { flex: 1, justifyContent: 'center', gap: spacing.md },
  heading: { fontSize: 20, fontFamily: fonts.semiBold, color: colors.text },
  sub: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: -4 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 56,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  inputWrapError: { borderColor: '#EF4444' },
  flag: { fontSize: 15, fontFamily: fonts.medium, color: colors.text },
  input: { flex: 1, fontSize: 16, fontFamily: fonts.regular, color: colors.text },
  errorText: { fontSize: 13, fontFamily: fonts.regular, color: '#EF4444', marginTop: -4 },

  footer: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  skipBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radii.lg,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
    backgroundColor: colors.surface,
  },
  skipText: { fontSize: 15, fontFamily: fonts.medium, color: colors.textSecondary },
  nextBtnOverride: { flex: 2 },
});
