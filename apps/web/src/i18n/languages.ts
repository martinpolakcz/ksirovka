export const SUPPORTED_LANGUAGES = [
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "hr", label: "Hrvatski", flag: "🇭🇷" },
  { code: "sl", label: "Slovenščina", flag: "🇸🇮" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "cs";

export const LANGUAGE_STORAGE_KEY = "ksirovka-lang";

export function isLanguageCode(value: string): value is LanguageCode {
  return SUPPORTED_LANGUAGES.some((l) => l.code === value);
}
