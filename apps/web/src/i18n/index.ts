import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./locales";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isLanguageCode,
  type LanguageCode,
} from "./languages";

function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && isLanguageCode(stored)) return stored;
  const browser = navigator.language.slice(0, 2);
  if (isLanguageCode(browser)) return browser;
  return DEFAULT_LANGUAGE;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
});

document.documentElement.lang = i18n.language;

export default i18n;
