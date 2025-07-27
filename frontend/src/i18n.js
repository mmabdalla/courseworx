import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "welcome": "Welcome to CourseWorx",
      "login": "Log in",
      "signup": "Sign up",
      // Add more translations as needed
    }
  },
  ar: {
    translation: {
      "welcome": "مرحبا بك في كورس وركس",
      "login": "تسجيل الدخول",
      "signup": "إنشاء حساب",
      // Add more translations as needed
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Direction switching logic
export function setDocumentDirection(lang) {
  if (lang === 'ar') {
    document.documentElement.dir = 'rtl';
  } else {
    document.documentElement.dir = 'ltr';
  }
}

export default i18n; 