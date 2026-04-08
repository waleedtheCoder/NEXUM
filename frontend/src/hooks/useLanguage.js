import { useUser } from '../context/UserContext';
import { translations } from '../constants/translations';

export function useLanguage() {
  const { isUrdu, toggleLanguage } = useUser();
  const t = isUrdu ? translations.ur : translations.en;
  // RTL style helper — apply to Text elements that should flip direction in Urdu
  const rtl = isUrdu ? { textAlign: 'right', writingDirection: 'rtl' } : {};
  return { t, isUrdu, toggleLanguage, rtl };
}
