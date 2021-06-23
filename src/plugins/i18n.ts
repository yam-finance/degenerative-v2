import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zh from '../../public/locales/zh.json';
import en from '../../public/locales/en.json';

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
    },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['zh', 'en'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    debug: process.env.NODE_ENV === 'development',
  });

export default i18next;
