// src/components/HeaderNav.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n/i18n";
import { useSession } from "next-auth/react";
import SidebarNav from "@/components/SidebarNav";
import Logo from "@/assets/logo.png";

type Locale = "lv" | "en" | "ru";

type Props = {
  locale: Locale;
  className?: string;
  /** When provided, header renders a dashboard sidebar toggle in the left slot */
  sidebarOpen?: boolean;                 // 👈 NEW (optional)
  onToggleSidebar?: () => void;          // 👈 NEW (optional)
};

const LOCALE_RE = /^\/(lv|en|ru)(?=\/|$)/;
const withLocale = (pathname: string, next: Locale) =>
  LOCALE_RE.test(pathname) ? pathname.replace(LOCALE_RE, `/${next}`) : `/${next}${pathname}`;

export default function HeaderNav({
  locale,
  className = "",
  sidebarOpen,
  onToggleSidebar,
}: Props) {
  const t = useTranslations("publicNav");
  const tLanding = useTranslations("landing.nav");

  const pathname = usePathname() || "/";
  const router = useRouter();
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const [open, setOpen] = useState(false);              // mobile navbar
  const [sidebarSheet, setSidebarSheet] = useState(false); // public slide-over
  useEffect(() => { setOpen(false); setSidebarSheet(false); }, [pathname]);

  // Is this a dashboard route?
  const parts = pathname.split("/").filter(Boolean);
  const seg1 = parts[1] || "";
  const DASHBOARD_SEGS = new Set([
    "dashboard","calendar","todo","groceries","work-diary","weather","stats","admin",
  ]);
  const isDashboardArea = DASHBOARD_SEGS.has(seg1);

  const items = useMemo(
    () => [
      { href: `/${locale}`, label: t("home") },
      { href: `/${locale}/about`, label: t("about") },
      { href: `/${locale}/suggestions`, label: t("suggestions") },
      { href: `/${locale}/pricing`, label: t("pricing") },
    ],
    [locale, t]
  );

  const isActive = (href: string) =>
    pathname === href || pathname.replace(/\/$/, "") === href.replace(/\/$/, "");
  const linkCls = (href: string) =>
    `transition-colors text-white/90 hover:text-white ${isActive(href) ? "font-semibold text-white" : ""}`;
  const selectCls =
    "rounded-md border border-white/30 bg-white/10 text-white px-2 py-1 text-sm " +
    "outline-none hover:bg-white/15 [&>option]:bg-white [&>option]:text-neutral-900";
  const loginCls = "text-white/90 hover:text-white";
  const ctaCls = "rounded-xl px-4 py-2 font-semibold bg-white text-indigo-700 hover:bg-white/90";

  function changeLocale(next: Locale) { router.push(withLocale(pathname, next)); }

  // Left fixed slot: dashboard toggle (when props provided), else public App button (authed)
  const leftSlot = (() => {
    if (isAuthed && isDashboardArea && onToggleSidebar) {
      // dashboard toggle
      return (
        <button
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/15 hover:bg-white/25"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? "⟨⟨" : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      );
    }
    if (isAuthed && !isDashboardArea) {
      // public: open slide-over app menu
      return (
        <button
          onClick={() => setSidebarSheet(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/15 hover:bg-white/25"
          title="Open app menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      );
    }
    // spacer to prevent layout shift
    return <span aria-hidden className="inline-block h-9 w-9" />;
  })();

  return (
    <header
      className={
        "sticky top-0 z-40 shadow-sm text-white " +
        "bg-gradient-to-r from-[#4f46e5] via-[#6d5ae6] to-[#8b5cf6] " +
        className
      }
    >
      {/* fixed left slot prevents jump */}
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[48px_1fr_auto] items-center px-4 sm:px-6 lg:px-8 gap-3">
        <div className="flex items-center">{leftSlot}</div>

        <div className="flex min-w-0 items-center gap-6">
          <Link href={`/${locale}`} className="flex items-center gap-3 shrink-0">
            <Image src={Logo} alt="CalendarIt logo" priority className="h-9 w-9 rounded-md object-contain" />
            <span className="text-lg font-semibold leading-none">CalendarIt</span>
          </Link>

          <nav className="hidden gap-6 md:flex">
            {items.map((i) => (
              <Link key={i.href} href={i.href} className={linkCls(i.href)}>{i.label}</Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <select aria-label="Language" value={locale} onChange={(e) => changeLocale(e.target.value as Locale)} className={selectCls}>
            <option value="lv">LV</option><option value="en">EN</option><option value="ru">RU</option>
          </select>

          {!isAuthed ? (
            <>
              <Link href={`/${locale}/login`} className={loginCls}>{tLanding("login")}</Link>
              <Link href={`/${locale}/register`} className={ctaCls}>{tLanding("getStarted")}</Link>
            </>
          ) : null}

          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`md:hidden rounded-md p-2 ${loginCls}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu (unchanged) */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-gradient-to-r from-[#4f46e5] via-[#6d5ae6] to-[#8b5cf6]">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3">
              {items.map((i) => (
                <Link key={i.href} href={i.href} className={linkCls(i.href)} onClick={() => setOpen(false)}>
                  {i.label}
                </Link>
              ))}
              {/* language etc. */}
            </div>
          </div>
        </div>
      )}

      {/* Public slide-over App menu (unchanged) */}
      {sidebarSheet && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarSheet(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white shadow-xl p-3 overflow-y-auto">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-700">App menu</div>
              <button onClick={() => setSidebarSheet(false)} className="rounded-md p-1 text-neutral-600 hover:bg-neutral-100" aria-label="Close">✕</button>
            </div>
            <SidebarNav />
          </div>
        </div>
      )}
    </header>
  );
}
