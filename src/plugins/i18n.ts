import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zh from '../../public/locales/zh.json';
import en from '../../public/locales/en.json';
import fr from '../../public/locales/fr.json';
import de from '../../public/locales/de.json';

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      zh: {
        translation: zh,
      },
      en: {
        translation: en,
      },
      fr: {
        translation: fr,
      },
      de: {
        translation: de,
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['zh', 'en', 'fr', 'de'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    debug: process.env.NODE_ENV === 'development',
  });

export default i18next;
