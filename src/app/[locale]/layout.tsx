// src/app/[locale]/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import "../globals.css";

import { I18nProvider } from "@/lib/i18n/i18n";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "Calendarit" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function loadMessages(loc: Locale) {
  try {
    const mod = await import(`@/lib/i18n/messages/${loc}.json`);
    return mod.default;
  } catch {
    const fb = await import(`@/lib/i18n/messages/${defaultLocale}.json`);
    return fb.default;
  }
}

// Server component
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolved = await Promise.resolve(params);
  const raw = resolved?.locale;

  const locale: Locale = (locales as readonly string[]).includes(raw)
    ? (raw as Locale)
    : (defaultLocale as Locale);

  const messages = await loadMessages(locale);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <AuthProvider>
        {/* Sticky footer shell */}
        <div className="min-h-dvh flex flex-col bg-white">
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </I18nProvider>
  );
}
