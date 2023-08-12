import { initReactI18next, useTranslation } from "react-i18next";
import en from "@/locales/en";
import ja from "@/locales/ja";
import { getLocales } from "react-native-localize";
import i18n from "i18next";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  resources: {
    en: { translation: en },
    ja: { translation: ja },
  },
  lng: getLocales()[0].languageCode,
  fallbackLng: ["en", "ja"],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

export { useTranslation };
