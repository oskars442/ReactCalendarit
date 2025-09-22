// src/app/[locale]/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "@/lib/i18n/i18n";
import Logo from "@/assets/logo.png";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Locale = "lv" | "en" | "ru";
const LOCALE_RE = /^\/(lv|en|ru)/;
const withLocale = (p: string, next: Locale) => p.replace(LOCALE_RE, `/${next}`);

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export default function LoginPage() {
  const t = useTranslations("login");
  const { locale } = useParams<{ locale: Locale }>();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: `/${locale}/dashboard`,
      });
      if (res?.ok) router.push(res.url || `/${locale}/dashboard`);
      else setError(t("invalid"));
    } finally {
      setLoading(false);
    }
  }

  function changeLocale(next: Locale) {
    router.push(withLocale(pathname, next));
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0b1020] via-[#121a36] to-[#0b1020] text-white">
   {/* header with back + locale */}
<header className="absolute inset-x-0 top-0 z-20">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <Link href={`/${locale}`} className="flex items-center gap-2 text-white/90 hover:text-white">
      <Image
        src={Logo}
        alt="CalendarIt"
        width={Logo.width}
        height={Logo.height}
        priority
        className="h-7 w-7 object-contain"
      />
      <span className="font-semibold">CalendarIt</span>
    </Link>

    {/* dark select with custom chevron */}
    <div className="relative">
      <select
        aria-label="Language"
        value={locale}
        onChange={(e) => changeLocale(e.target.value as Locale)}
        className="select-dark appearance-none pr-8"
      >
        <option value="lv">LV</option>
        <option value="en">EN</option>
        <option value="ru">RU</option>
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-80"
        width="16" height="16" viewBox="0 0 24 24" fill="none"
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  </div>
</header>

      {/* glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_15%_-5%,rgba(99,102,241,0.35),transparent_60%),radial-gradient(600px_300px_at_85%_-5%,rgba(168,85,247,0.25),transparent_60%)]" />

      {/* two-column layout on desktop */}
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 px-4 pt-24 pb-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Left promotional pane (desktop) */}
        <aside className="hidden select-none lg:flex lg:flex-col lg:justify-center">
          <h2 className="text-4xl font-extrabold leading-tight">{t("welcomeTitle")}</h2>
          <p className="mt-3 max-w-md text-white/75">{t("welcomeSub")}</p>
        </aside>

        {/* Right: form card */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <Image
    src={Logo}
    alt="CalendarIt"
    width={Logo.width}
    height={Logo.height}
    priority
    className="h-7 w-7 object-contain"
  />
              <div className="text-lg font-semibold">CalendarIt</div>
            </div>

            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="mt-1 text-sm text-white/70">{t("subtitle")}</p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-5 grid gap-4">
              <label className="space-y-1">
                <span className="text-sm text-white/85">{t("email")}</span>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-10 py-3 text-white placeholder-white/40 outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-400"
                  />
                  <MailIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                </div>
              </label>

              <label className="space-y-1">
                <span className="text-sm text-white/85">{t("password")}</span>
                <div className="relative">
                  <input
                    name="password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-10 py-3 text-white placeholder-white/40 outline-none transition focus:border-transparent focus:ring-2 focus:ring-indigo-400"
                  />
                  <LockIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                    aria-label={show ? t("hide") : t("show")}
                  >
                    {show ? t("hide") : t("show")}
                  </button>
                </div>
              </label>

              <div className="mt-1 flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-400 focus:ring-indigo-400"
                  />
                  <span className="text-white/80">{t("remember")}</span>
                </label>
                <Link
                  href={`/${locale}/forgot`}
                  className="text-indigo-300 underline-offset-4 hover:text-white hover:underline"
                >
                  {t("forgot")}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 font-semibold transition-colors hover:bg-indigo-500 disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> {t("signing")}
                  </span>
                ) : (
                  t("signIn")
                )}
              </button>
            </form>

            {process.env.NEXT_PUBLIC_ADMIN_HINT && (
              <p className="mt-3 text-xs text-white/60">{process.env.NEXT_PUBLIC_ADMIN_HINT}</p>
            )}

            <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/70">
              {t("noAccount")}{" "}
              <Link
                href={`/${locale}/register`}
                className="text-indigo-300 underline-offset-4 hover:text-white hover:underline"
              >
                {t("createOne")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
