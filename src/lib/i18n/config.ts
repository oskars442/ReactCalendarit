export const locales = ['lv', 'en', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'lv';