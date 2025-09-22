"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useLocale, useTranslations} from "@/lib/i18n/i18n";

export default function Footer() {
  const t = useTranslations("footer");
  const locale = (useLocale() || "en") as "lv" | "en" | "ru";
  const pathname = usePathname() || "/";
  const year = new Date().getFullYear();

  // Landing = /lv, /en, /ru (with or without trailing slash)
  const isLanding = /^\/(lv|en|ru)\/?$/.test(pathname);

  // Chrome
  const wrapCls = isLanding
    ? // gradient bar to ensure contrast over light content
      "border-t border-white/10 bg-gradient-to-b from-indigo-600/40 via-indigo-600/30 to-violet-700/40 text-white"
    : "border-t border-neutral-200 bg-white text-neutral-700";

  const titleCls = isLanding
    ? "text-white font-semibold"
    : "text-neutral-900 font-semibold";

  const linkCls = isLanding
    ? "text-white/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm"
    : "text-neutral-700 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 rounded-sm";

  const subtle = isLanding ? "text-white/70" : "text-neutral-500";

  const dividerCls = isLanding ? "border-white/15" : "border-neutral-200";

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
            <div className={`text-2xl font-bold ${isLanding ? "text-white" : "text-neutral-900"}`}>
              Calendarit
            </div>
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
