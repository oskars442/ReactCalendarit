// src/app/[locale]/(public)/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import HeaderNav from "@/components/HeaderNav";

const SITE = "https://calendarit.lv";

type Locale = "lv" | "en" | "ru";
type Params = { locale: Locale } | Promise<{ locale: Locale }>;

const copy: Record<Locale, { title: string; description: string }> = {
  lv: {
    title: "CalendarIt — Organizē savu dienu vienā vietā",
    description:
      "Plāno uzdevumus, seko finansēm, uzturi kalendāru un pārbaudi laikapstākļus — viss vienuviet. CalendarIt — tavs digitālais dzīves centrs.",
  },
  en: {
    title: "CalendarIt — Organize your day in one place",
    description:
      "Plan tasks, track finances, keep a calendar and check the weather — all beautifully connected in one app.",
  },
  ru: {
    title: "CalendarIt — Организуйте день в одном месте",
    description:
      "Планируйте задачи, следите за финансами, ведите календарь и смотрите погоду — всё в одном приложении.",
  },
};

const ogLocale: Record<Locale, string> = {
  lv: "lv_LV",
  en: "en_US",
  ru: "ru_RU",
};

// ✅ Lokalizēts metadata ģenerators
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const p = (params as any)?.then ? await (params as Promise<{ locale: Locale }>) : (params as { locale: Locale });
  const locale: Locale = p?.locale ?? "lv";
  const { title, description } = copy[locale];

  return {
    title,
    description,
    alternates: {
      canonical: SITE,
      languages: {
        lv: `${SITE}/lv`,
        en: `${SITE}/en`,
        ru: `${SITE}/ru`,
      },
    },
    openGraph: {
      title,
      description,
      url: SITE,
      siteName: "CalendarIt",
      locale: ogLocale[locale],
      type: "website",
      images: [
        {
          url: `${SITE}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: "CalendarIt ekrānuzņēmums",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE}/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
    },
    // Ja izmanto manifestu/ikonas, Next automātiski tās pievienos no /app/icon.* un /app/manifest.webmanifest
  };
}

// ✅ Publiskais layout ar locale drošu izvilkšanu
export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const p = (params as any)?.then ? await (params as Promise<{ locale: Locale }>) : (params as { locale: Locale });
  const locale: Locale = p?.locale ?? "lv";

  return (
    <>
      <HeaderNav locale={locale} />
      <main>{children}</main>
    </>
  );
}
