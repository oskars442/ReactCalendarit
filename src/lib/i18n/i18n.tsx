'use client';

import { NextIntlClientProvider, useFormatter, useLocale, useTranslations } from 'next-intl';
import type { AbstractIntlMessages } from 'next-intl';
import type { ReactNode } from 'react';
import type { Locale } from './config';

type Props = {
  children: ReactNode;
  locale: Locale;
  messages: AbstractIntlMessages;
};

export function I18nProvider({ children, locale, messages }: Props) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="Europe/Riga"
      onError={(err) => {
        // Silence missing-message noise in prod; keep other errors visible
        // @ts-ignore next-intl sets .code
        if (process.env.NODE_ENV === 'production' && err.code === 'MISSING_MESSAGE') return;
        console.warn('[i18n]', err);
      }}
      // Show "namespace.key" when a message is missing (useful during migration)
      getMessageFallback={({ namespace, key }) =>
        `${namespace ? `${namespace}.` : ''}${key}`
      }
    >
      {children}
    </NextIntlClientProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Conveniences for components                                         */
/* ------------------------------------------------------------------ */

/** Typed translator with optional namespace, e.g.:
 *   const t = useT('weather');  t('title')
 */
export function useT(namespace?: string) {
  // next-intl's useTranslations already handles rich values and formatting
  return useTranslations(namespace);
}

/** Optional bundle if you want locale + formatter together */
export function useI18n(namespace?: string) {
  const t = useTranslations(namespace);
  const locale = useLocale();
  const fmt = useFormatter();
  return { t, locale, fmt };
}

/* Re-exports (so imports can come from '@/lib/i18n/i18n') */
export { useTranslations, useLocale, useFormatter };
