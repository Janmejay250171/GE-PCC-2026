import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import kn from './locales/kn.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' }
];

const STORAGE_KEY = 'sehatsure_language';
const validCodes = SUPPORTED_LANGUAGES.map((l) => l.code);

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('sehatsure-language');
    if (saved && validCodes.includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.warn('[i18n] Could not read language from localStorage:', e);
  }
  return 'en';
}

const initialLng = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      kn: { translation: kn }
    },
    lng: initialLng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    }
  });

// Set HTML lang attribute on start
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLng;
}

// Persist language changes to localStorage
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
    localStorage.setItem('sehatsure-language', lng);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng;
    }
  } catch (e) {
    console.warn('[i18n] Could not persist language to localStorage:', e);
  }
});

export default i18n;
