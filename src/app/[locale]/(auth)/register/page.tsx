"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations, useLocale } from "@/lib/i18n/i18n";
import Logo from "@/assets/logo.png";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Gender = "" | "female" | "male" | "other" | "na";

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: Gender;
  birthdate: string; // YYYY-MM-DD
  country: string;
  agree: boolean;
};

const COUNTRY_KEYS = [
  "Latvia",
  "Lithuania",
  "Estonia",
  "Poland",
  "Germany",
  "Finland",
  "Sweden",
  "Norway",
  "Denmark",
  "United Kingdom",
  "Ireland",
  "Netherlands",
  "Belgium",
  "France",
  "Spain",
  "Italy",
  "Portugal",
  "Czech Republic",
  "Slovakia",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Greece",
  "United States",
  "Canada",
] as const;

/* ---------- small helpers ---------- */
function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

export default function RegisterPage() {
  const t = useTranslations("register");
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const currentLocale = (useLocale() || params?.locale || "en") as "lv" | "en" | "ru";

  const [form, setForm] = useState<Form>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    gender: "",
    birthdate: "",
    country: "Latvia",
    agree: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // 13+ only
  const maxBirthdate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().slice(0, 10);
  }, []);

  function update<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = t("errors.firstName");
    if (!form.lastName.trim()) e.lastName = t("errors.lastName");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("errors.email");
    if (form.password.length < 8) e.password = t("errors.password");
    if (!form.gender) e.gender = t("errors.gender");
    if (!form.birthdate) e.birthdate = t("errors.birthdateRequired");
    else if (form.birthdate > maxBirthdate) e.birthdate = t("errors.birthdateYoung");
    if (!form.country) e.country = t("errors.country");
    if (!form.agree) e.agree = t("errors.agree");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // 1) Create user
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email.trim().toLowerCase(),
          password: form.password,
          gender: form.gender,
          birthdate: form.birthdate,
          country: form.country,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("errors.failed"));
      }

      // 2) Auto-login
      const r = await signIn("credentials", {
  redirect: false,
  email: form.email,
  password: form.password,
});
if (r?.error) throw new Error(r.error);

      // 3) Redirect to app (locale-aware)
      window.location.href = `/${currentLocale}/dashboard`;
    } catch (err: any) {
      setErrors((e) => ({ ...e, submit: err?.message || t("errors.failed") }));
    } finally {
      setSubmitting(false);
    }
  }

  function onChangeLocale(next: "lv" | "en" | "ru") {
    router.push(`/${next}/register`);
  }

  const inputBase =
    "w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:ring-2 " +
    "border-white/15 bg-white/10 text-white placeholder-white/50 focus:border-indigo-400 focus:ring-indigo-300";

  const errText = "mt-1 text-sm text-red-400";

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#0b0d22] via-[#12183a] to-[#1e1b4b] text-white">
      {/* Top chrome: brand, back, locale switcher */}
      <header className="py-4">
        <Container>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
<Link href={`/${currentLocale}`} className="flex items-center gap-2 text-white/90 hover:text-white">
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

              <Link
                href={`/${currentLocale}`}
                className="hidden sm:inline text-sm text-white/70 hover:text-white/90"
              >
                — {t("backToHome")}
              </Link>
            </div>

            {/* Locale selector now uses .select-dark */}
            <select
              aria-label="Language"
              value={currentLocale}
              onChange={(e) => onChangeLocale(e.target.value as "lv" | "en" | "ru")}
              className="select-dark text-sm"
            >
              <option value="lv">LV</option>
              <option value="en">EN</option>
              <option value="ru">RU</option>
            </select>
          </div>
        </Container>
      </header>

      {/* Content */}
      <Container>
        <div className="grid gap-8 py-10 md:grid-cols-2 md:py-16">
          {/* Left rail with message */}
          <div className="order-2 md:order-1">
            <div className="max-w-md">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                {t("title")}
              </h1>
              <p className="mt-3 text-white/80">{t("subtitle")}</p>

              <div className="mt-10 hidden md:block rounded-2xl border border-white/10 bg-white/5 p-5">
                <ul className="space-y-2 text-white/80">
                  <li>• {t("benefits.0", { default: "Keep tasks, money and calendar in one place" })}</li>
                  <li>• {t("benefits.1", { default: "Weather and stats beautifully integrated" })}</li>
                  <li>• {t("benefits.2", { default: "Free to start, no credit card needed" })}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form card */}
          <div className="order-1 md:order-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
              <form onSubmit={onSubmit} className="grid gap-6">
                {/* Names */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/90">
                      {t("firstName")}
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                      className={inputBase}
                      autoComplete="given-name"
                      placeholder={t("firstName")}
                    />
                    {errors.firstName && <p className={errText}>{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/90">
                      {t("lastName")}
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                      className={inputBase}
                      autoComplete="family-name"
                      placeholder={t("lastName")}
                    />
                    {errors.lastName && <p className={errText}>{errors.lastName}</p>}
                  </div>
                </div>

                {/* Email & Password */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/90">
                      {t("email")}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className={inputBase}
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className={errText}>{errors.email}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/90">
                      {t("password")}
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        className={inputBase + " pr-12"}
                        autoComplete="new-password"
                        placeholder={t("passwordHint")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-2 top-2.5 inline-flex items-center rounded-lg px-2 py-1 text-xs text-white/80 hover:bg-white/10"
                        aria-label={showPass ? t("hide") : t("show")}
                      >
                        {showPass ? t("hide") : t("show")}
                      </button>
                    </div>
                    {errors.password && <p className={errText}>{errors.password}</p>}
                  </div>
                </div>

                {/* Gender, Birthdate, Country */}
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/90">
                      {t("gender")}
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) => update("gender", e.target.value as Gender)}
                      className="select-dark w-full"
                    >
                      <option value="">{t("select")}</option>
                      <option value="female">{t("genders.female")}</option>
                      <option value="male">{t("genders.male")}</option>
                      <option value="other">{t("genders.other")}</option>
                      <option value="na">{t("genders.na")}</option>
                    </select>
                    {errors.gender && <p className={errText}>{errors.gender}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/90">
                      {t("birthdate")}
                    </label>
                    <input
                      type="date"
                      value={form.birthdate}
                      onChange={(e) => update("birthdate", e.target.value)}
                      className={inputBase}
                      min="1900-01-01"
                      max={maxBirthdate}
                    />
                    {errors.birthdate && <p className={errText}>{errors.birthdate}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/90">
                      {t("country")}
                    </label>
                    <select
                      value={form.country}
                      onChange={(e) => update("country", e.target.value)}
                      className="select-dark w-full"
                    >
                      {COUNTRY_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {t(`countries.${key}`)}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className={errText}>{errors.country}</p>}
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.agree}
                    onChange={(e) => update("agree", e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-white/20 bg-white/10 text-indigo-400 focus:ring-indigo-300"
                  />
                  <span className="text-sm leading-6 text-white/90">
                    {t.rich("agreeLine", {
                      terms: (chunks) => (
                        <Link href={`/${currentLocale}/terms`} className="underline">
                          {chunks}
                        </Link>
                      ),
                      privacy: (chunks) => (
                        <Link href={`/${currentLocale}/privacy`} className="underline">
                          {chunks}
                        </Link>
                      ),
                    })}
                  </span>
                </label>
                {errors.agree && <p className={errText}>{errors.agree}</p>}

                {/* Submit + errors */}
                {errors.submit && <p className={errText}>{errors.submit}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? t("creating") : t("signup")}
                </button>

                {/* Already have an account */}
                <div className="pt-2 text-sm text-white/70">
                  {t("haveAccount", { default: "Already have an account?" })}{" "}
                  <Link href={`/${currentLocale}/login`} className="underline">
                    {t("signin")}
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
