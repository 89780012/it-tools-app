export type Locale = (typeof locales)[number];

export const locales = ['zh', 'en', 'es', 'de', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'ar', 'hi'] as const;
export const defaultLocale: Locale = 'en';