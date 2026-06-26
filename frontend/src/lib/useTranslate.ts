import { getTranslation, Locale, TranslationOptions } from "./i18n";

export function useTranslate(lang: Locale) {
  return function t(key: string, options?: TranslationOptions) {
    return getTranslation(lang, key, options);
  };
}
