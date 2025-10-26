"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n/i18n";
import { useSession } from "next-auth/react";
import Logo from "@/assets/logo.png";
import SignOutButton from "@/components/SignOutButton";

type Locale = "lv" | "en" | "ru";

type Props = {
  locale: Locale;
  className?: string;
  /** Ja nodod, headeris dashboardā rāda sānu joslas slēdzi kreisajā slotā */
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
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
  const tNav = useTranslations("nav");

  const pathname = usePathname() || "/";
  const router = useRouter();
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  function handleSidebarButton() {
    const isMobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      window.dispatchEvent(new CustomEvent("sidebar:open"));
    } else if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      window.dispatchEvent(new CustomEvent("sidebar:open"));
    }
  }

  const [open, setOpen] = useState(false);
  const [sidebarSheet, setSidebarSheet] = useState(false);

  // Aizver mobilās izvēlnes, mainoties ceļam
  useEffect(() => {
    setOpen(false);
    setSidebarSheet(false);
  }, [pathname]);

  // Body scroll lock, kad atvērts app slide-over
  useEffect(() => {
    if (typeof document === "undefined") return;
    const { style } = document.body;
    const prev = style.overflow;
    style.overflow = sidebarSheet ? "hidden" : prev || "";
    return () => {
      style.overflow = prev || "";
    };
  }, [sidebarSheet]);

  // Aizver visus slīdošos paneļus, kad lietotājs vairs nav ielogots
useEffect(() => {
  if (status !== "authenticated") {
    setOpen(false);         // publiskais top-nav hamburgers
    setSidebarSheet(false); // “App menu” slide-over
  }
}, [status]);

  // Vai esam app (dashboard) zonā?
  const parts = pathname.split("/").filter(Boolean);
  const seg1 = parts[1] || "";
  const DASHBOARD_SEGS = new Set([
    "dashboard",
    "calendar",
    "todo",
    "groceries",
    "work-diary",
    "weather",
    "stats",
    "admin",
    "workout",
    "projects",
    "baby-tracker", 
    "profile",
  ]);
  const isDashboardArea = DASHBOARD_SEGS.has(seg1);

  // Publiskie top-nav linki
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
    `transition-colors text-white/90 hover:text-white ${
      isActive(href) ? "font-semibold text-white" : ""
    }`;

  const selectCls =
    "rounded-md border border-white/30 bg-white/10 text-white px-2 py-1 text-sm outline-none hover:bg-white/15 [&>option]:bg-white [&>option]:text-neutral-900";

  const loginCls = "text-white/90 hover:text-white";
  const ctaCls =
    "rounded-xl px-4 py-2 font-semibold bg-white text-indigo-700 hover:bg-white/90";

  // Disabled helpers
  const DISABLED_SEGS_PUBLIC = new Set(["pricing"]);
  const isDisabledHref = (href: string) => {
    const lastSeg = href.split("/").filter(Boolean).pop();
    return !!lastSeg && DISABLED_SEGS_PUBLIC.has(lastSeg);
  };
  const disabledLinkCls = "opacity-60 text-white/70 select-none cursor-no-red-xs";

  const DISABLED_SEGS_APP = new Set<string>(["stats", "projects"]);

  function changeLocale(next: Locale) {
    router.push(withLocale(pathname, next));
  }

  // Nerādām labo hamburgeri, ja esam ielogoti un dashboardā (tur jau ir kreisais)
  const showRightBurger = true;

  // Kreisais slot
  const leftSlot = (() => {
    if (isAuthed && isDashboardArea) {
      return (
        <button
          onClick={handleSidebarButton}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/15 hover:bg-white/25"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            "⟨⟨"
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      );
    }
    if (isAuthed && !isDashboardArea) {
      return (
        <button
          onClick={() => setSidebarSheet(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/15 hover:bg-white/25"
          title="Open app menu"
          aria-label="Open app menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      );
    }
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
            <Image
              src={Logo}
              alt="CalendarIt logo"
              priority
              className="h-9 w-9 rounded-md object-contain"
            />
            <span className="text-lg font-semibold leading-none truncate">CalendarIt</span>
          </Link>

          <nav className="hidden gap-6 md:flex">
            {items.map((i) =>
              isDisabledHref(i.href) ? (
                <span
                  key={i.href}
                  aria-disabled="true"
                  className={disabledLinkCls}
                  title="Coming soon"
                  tabIndex={-1}
                >
                  {i.label}
                </span>
              ) : (
                <Link key={i.href} href={i.href} className={linkCls(i.href)}>
                  {i.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <select
            aria-label="Language"
            value={locale}
            onChange={(e) => changeLocale(e.target.value as Locale)}
            className={selectCls}
          >
            <option value="lv">LV</option>
            <option value="en">EN</option>
            <option value="ru">RU</option>
          </select>

          {!isAuthed ? (
            <>
              {/* slēpjam xs ekrānā, atstājam ≥sm */}
              <Link href={`/${locale}/login`} className={`${loginCls} hidden sm:inline`}>
                {tLanding("login")}
              </Link>
              <Link
                href={`/${locale}/register`}
                className={`${ctaCls} hidden sm:inline-flex`}
              >
                {tLanding("getStarted")}
              </Link>
            </>
          ) : null}

          {showRightBurger && (
            <button
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={`md:hidden rounded-md p-2 ${loginCls}`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu (public top-nav) */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-gradient-to-r from-[#4f46e5] via-[#6d5ae6] to-[#8b5cf6]">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3">
              {items.map((i) =>
                isDisabledHref(i.href) ? (
                  <span
                    key={i.href}
                    aria-disabled="true"
                    className={disabledLinkCls}
                    title="Coming soon"
                    tabIndex={-1}
                  >
                    {i.label}
                  </span>
                ) : (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={linkCls(i.href)}
                    onClick={() => setOpen(false)}
                  >
                    {i.label}
                  </Link>
                )
              )}

              {/* Login/CTA – mobilajā izvēlnē neielogotiem */}
              {!isAuthed && (
                <div className="mt-3 flex flex-col gap-2">
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-4 py-2 text-center bg-white/10 hover:bg-white/15 text-white"
                  >
                    {tLanding("login")}
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-4 py-2 text-center font-semibold bg-white text-indigo-700 hover:bg-white/90"
                  >
                    {tLanding("getStarted")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Public slide-over App menu (authed, ārpus dashboarda) */}
      {sidebarSheet && (
        <div className="fixed inset-0 z-[90]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarSheet(false)}
            aria-hidden
          />

          {/* Panelis: fullscreen uz mobīlā, šaurs kreisais panelis uz desktopa */}
          <aside
            role="dialog"
            aria-modal="true"
            className={`
              absolute bg-white shadow-xl flex flex-col transition-transform duration-200
              inset-0
              md:inset-y-0 md:left-0 md:right-auto md:top-0 md:bottom-0 md:w-[320px]
            `}
          >
            {/* Header rinda */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="text-sm font-semibold text-neutral-700">App menu</div>
              <button
                onClick={() => setSidebarSheet(false)}
                className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Saturs */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <nav className="space-y-1">
                {[
                  { segment: "dashboard", key: "overview" },
                  { segment: "calendar", key: "calendar" },
                  { segment: "work-diary", key: "workDiary" },
                  { segment: "todo", key: "todo" },
                  { segment: "workout", key: "workout" },
                  { segment: "groceries", key: "groceries" },
                  { segment: "weather", key: "weather" },
                  { segment: "stats", key: "stats" },
                  { segment: "projects", key: "projects" },
                  { segment: "baby-tracker", key: "babyTracker" },
                  { segment: "profile", key: "profile" },
                ].map(({ segment, key }) => {
                  const href = `/${locale}/${segment}`;
                  const active = pathname === href || pathname.startsWith(href + "/");
                  const disabled = DISABLED_SEGS_APP.has(segment);

                  const baseCls =
                    "flex h-12 items-center rounded-md px-3 text-[16px] transition-colors";
                  const enabledCls = active
                    ? "bg-neutral-100 font-semibold text-neutral-900"
                    : "text-neutral-700 hover:bg-neutral-50";
                  const disabledCls = "text-neutral-400 opacity-60 select-none cursor-no-red-xs";

                  if (disabled) {
                    return (
                      <span
                        key={segment}
                        aria-disabled="true"
                        title="Drīzumā"
                        className={`${baseCls} ${disabledCls}`}
                      >
                        {tNav(key)}
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={segment}
                      href={href}
                      onClick={() => setSidebarSheet(false)}
                      aria-current={active ? "page" : undefined}
                      className={`${baseCls} ${enabledCls}`}
                    >
                      {tNav(key)}
                    </Link>
                  );
                })}
              </nav>

              {isAuthed ? (
                <div className="mt-4 pl-1 pr-3">
                  <SignOutButton className="w-full" />
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
