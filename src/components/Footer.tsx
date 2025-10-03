"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "@/lib/i18n/i18n";

export default function Footer() {
  const t = useTranslations("footer");
  const locale = (useLocale() || "en") as "lv" | "en" | "ru";
  const pathname = usePathname() || "/";
  const year = new Date().getFullYear();

  // ====== Variants: izvēlies "deep" | "midnight" | "charcoal" ======
  const theme: "deep" | "midnight" | "charcoal" = "deep";

  const gradientMap = {
    deep:
      // Tumšāks indigo→violet + neliela necaurspīdība
      "border-t border-white/10 text-white " +
      "bg-gradient-to-b from-indigo-800/70 via-indigo-900/70 to-violet-900/70",
    midnight:
      // Tumšs zils→indigo ar dziļumu
      "border-t border-white/10 text-white " +
      "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900",
    charcoal:
      // Grafīts ar violetu piesitienu
      "border-t border-white/10 text-white " +
      "bg-gradient-to-b from-neutral-900 via-neutral-900 to-violet-950/80",
  } as const;

  // Vienmēr gradient visās lapās
  const wrapCls = gradientMap[theme];

  const titleCls = "text-white font-semibold";
  const linkCls =
    "text-white/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm";
  const subtle = "text-white/70";
  const dividerCls = "border-white/15";

  const nav = [
    { href: `/${locale}/`, label: t("nav.home") },
    { href: `/${locale}/about`, label: t("nav.about") },
    { href: `/${locale}/terms`, label: t("nav.terms") },
    { href: `/${locale}/privacy`, label: t("nav.privacy") },
  ];

  return (
    <footer className={wrapCls}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-4 items-start">
          {/* Brand */}
          <div>
            <div className="text-2xl font-bold text-white">Calendarit</div>
            <Link href={`/${locale}/about`} className={`mt-2 inline-block ${linkCls}`}>
              {t("learnMore")}
            </Link>
          </div>

          {/* Contacts */}
          <div>
            <div className={`mb-2 ${titleCls}`}>{t("contact.title")}</div>
            <div>
              <a href="mailto:calendarit2025@gmail.com" className={linkCls}>
                calendarit2025@gmail.com
              </a>
            </div>
            <div className={subtle}>Liepāja, Latvia</div>
          </div>

          {/* Nav */}
          <div>
            <div className={`mb-2 ${titleCls}`}>{t("nav.title")}</div>
            <ul className="space-y-1">
              {nav.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className={linkCls}>
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow */}
          <div>
            <div className={`mb-2 ${titleCls}`}>{t("follow.title")}</div>
            <div className={`${subtle} mb-1`}>{t("follow.comingSoon")}</div>
            <ul className="space-y-1">
              <li><span className={`${subtle} cursor-not-allowed`}>Instagram</span></li>
              <li><span className={`${subtle} cursor-not-allowed`}>Facebook</span></li>
              <li><span className={`${subtle} cursor-not-allowed`}>TikTok</span></li>
            </ul>
          </div>
        </div>

        <div className={`mt-10 border-t pt-6 text-center text-sm ${dividerCls}`}>
          © {year} Calendarit. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
