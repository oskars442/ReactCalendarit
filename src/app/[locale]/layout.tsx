// src/app/[locale]/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import "../globals.css";

import { I18nProvider } from "@/lib/i18n/i18n";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = { title: "Calendarit" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Mazs helperis drošai ziņu ielādei + fallbackam
async function loadMessages(loc: Locale) {
  try {
    return (await import(`@/lib/i18n/messages/${loc}.json`)).default;
  } catch {
    return (await import(`@/lib/i18n/messages/${defaultLocale}.json`)).default;
  }
}

// PIEZĪME: Šis ir Server Component (te NELIEKAM <html>/<body>)
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  // Atbalstām Next 15 “async params”, bet strādās arī ar parastu objektu
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolved = await params as { locale: string };
  const raw = resolved?.locale;

  const locale = (locales as readonly string[]).includes(raw)
    ? (raw as Locale)
    : (defaultLocale as Locale);

  const messages = await loadMessages(locale);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <AuthProvider>{children}</AuthProvider>
    </I18nProvider>
  );
}
