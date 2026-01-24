import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import esMX from './locales/es-MX.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: en
            },
            'es-MX': {
                translation: esMX
            }
        },
        fallbackLng: 'es-MX', // Default to Spanish MX as requested
        lng: 'es-MX', // Force default to Spanish MX initially if no detection
        interpolation: {
            escapeValue: false // not needed for react as it escapes by default
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

export default i18n;
