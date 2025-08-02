// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import hrTranslation from './locales/hr.json';

const resources = {
	en: { translation: enTranslation },
	hr: { translation: hrTranslation },
};

// Check if window and localStorage are available before using them
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
	i18n.use(initReactI18next).init({
		resources,
		lng: localStorage.getItem('language') || 'en',
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false,
		},
	});
}

export default i18n;
