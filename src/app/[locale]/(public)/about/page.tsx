"use client";

import { useTranslations, useLocale } from "next-intl";

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-6 py-5 text-center backdrop-blur">
      <div className="text-3xl font-extrabold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-sm text-white/80">{label}</div>
    </div>
  );
}

export default function AboutPage() {
  const t = useTranslations("about");
  const locale = useLocale(); // izmanto, ja vajag

  const features = t.raw("features.list") as Array<{ icon: string; title: string; desc: string }>;
  const values = t.raw("values.list") as Array<{ title: string; desc: string }>;
  const timeline = t.raw("timeline.list") as Array<{ year: string; title: string; body: string }>;
type StatItem = { value: string; label: string };
type Stats = { first: StatItem; second: StatItem; third: StatItem };

const stats = t.raw("stats") as Stats;

  return (
    <main className="text-neutral-900">
      {/* HERO */}
      <section className="relative isolate overflow-hidden text-white py-24 md:py-28 bg-gradient-to-b from-[#4f46e5] via-[#6d5ae6] to-[#8b5cf6]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_300px_at_20%_-5%,rgba(255,255,255,0.25),transparent_60%),radial-gradient(700px_280px_at_80%_-10%,rgba(255,255,255,0.18),transparent_60%)]" />
        <Container>
          <div className="relative z-10 flex min-h-[40vh] flex-col items-center justify-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm">
              {t("hero.badge")}
            </span>

            <h1 className="text-center text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
              {t("hero.title")} <span className="opacity-95">CalendarIt</span>
            </h1>

            <p className="mt-4 max-w-3xl text-center text-white/90 text-lg">
              {t("hero.subtitle")}
            </p>

            <div className="mt-10 grid w-full gap-4 sm:grid-cols-3 lg:max-w-3xl">
  <Stat value={stats.first.value}  label={stats.first.label} />
  <Stat value={stats.second.value} label={stats.second.label} />
  <Stat value={stats.third.value}  label={stats.third.label} />
</div>
          </div>
        </Container>
      </section>

      {/* MISSION */}
      <section className="bg-white py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{t("mission.title")}</h2>
            <p className="mt-4 text-neutral-600">{t("mission.body")}</p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-3 font-semibold text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* VALUES */}
      <section className="bg-neutral-50 py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{t("values.title")}</h2>
            <p className="mt-4 text-neutral-600">{t("values.subtitle")}</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-neutral-900">{v.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* TIMELINE */}
      <section className="bg-white py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{t("timeline.title")}</h2>
            <p className="mt-4 text-neutral-600">{t("timeline.subtitle")}</p>
          </div>

          <ol className="relative mx-auto mt-10 max-w-3xl border-l border-neutral-200">
            {timeline.map((tItem) => (
              <li key={tItem.title} className="mb-8 ml-6">
                <span className="absolute -left-3 mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600">
                  ●
                </span>
                <h3 className="font-semibold text-neutral-900">
                  {tItem.year} — {tItem.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">{tItem.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden text-white bg-gradient-to-tr from-[#1e1b4b] via-[#2a2284] to-[#4f46e5]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_250px_at_15%_-10%,rgba(255,255,255,0.15),transparent_60%),radial-gradient(600px_250px_at_85%_-10%,rgba(255,255,255,0.15),transparent_60%)]" />
        <Container>
          <div className="relative z-10 grid gap-6 py-16 text-center sm:py-20">
            <h3 className="text-3xl font-bold sm:text-4xl">{t("cta.title")}</h3>
            <p className="mx-auto max-w-2xl text-white/90">{t("cta.subtitle")}</p>
            <div>
              <a
                href="mailto:calendarit2025@gmail.com"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-sm transition hover:bg-white/90"
                aria-label={t("cta.aria")}
              >
                {t("cta.button")}
              </a>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
