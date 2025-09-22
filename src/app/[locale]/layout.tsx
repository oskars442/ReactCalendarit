// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import "../globals.css";

import { I18nProvider } from "@/lib/i18n/i18n";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = { title: "Calendarit" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // In Next.js 15 App Router, params in server components can be async.
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;

  const locale: Locale = ((locales as readonly string[]).includes(raw)
    ? raw
    : defaultLocale) as Locale;

  // If a locale file is missing for any reason, fall back to defaultLocale.
  let messages: Record<string, any>;
  try {
    messages = (await import(`@/lib/i18n/messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`@/lib/i18n/messages/${defaultLocale}.json`)).default;
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
