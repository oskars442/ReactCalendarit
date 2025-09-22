'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useTranslations, useLocale} from '@/lib/i18n/i18n';

/* Lightweight helpers just for this page content */
function Container({children}:{children:React.ReactNode}) {
  return <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>;
}
function PrimaryButton({href, children}:{href:string; children:React.ReactNode}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-sm hover:bg-indigo-500 transition-colors"
    >
      {children}
    </Link>
  );
}
function GhostButton({href, children}:{href:string; children:React.ReactNode}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/5 px-5 py-3 text-white hover:bg-white/10 transition-colors"
    >
      {children}
    </Link>
  );
}

export default function Landing() {
  const t = useTranslations('landing');
  const locale = useLocale() || 'en';

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4f46e5] via-[#6d5ae6] to-[#8b5cf6] text-white">
      {/* HERO (no header here; header comes from (public)/layout.tsx) */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_60%)]" />
        <Container>
          <div className="py-16 md:py-24 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                {t('hero.eyebrow')}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
                {t('hero.h1')}
              </h1>
              <p className="mt-4 text-white/90 text-lg">{t('hero.sub')}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton href={`/${locale}/register`}>{t('hero.primaryCta')}</PrimaryButton>
                <GhostButton href={`/${locale}/weather`}>{t('hero.secondaryCta')}</GhostButton>
              </div>

              <p className="mt-3 text-sm text-white/70">{t('hero.noCard')}</p>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-2xl font-bold">4.8★</div>
                  <div className="text-xs text-white/80">{t('stats.rating')}</div>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-2xl font-bold">10k+</div>
                  <div className="text-xs text-white/80">{t('stats.users')}</div>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-xs text-white/80">{t('stats.uptime')}</div>
                </div>
              </div>
            </div>

            {/* App preview — make sure these files exist in /public/screens */}
            <div className="relative">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-2 shadow-2xl">
                <Image
                  src="/screens/overview-light.png"
                  alt="App preview"
                  width={1200}
                  height={760}
                  className="rounded-xl ring-1 ring-white/10"
                  priority
                />
              </div>
              <div className="absolute -right-6 -bottom-6 hidden lg:block rounded-2xl border border-white/20 bg-white/10 p-2 rotate-3">
                <Image
                  src="/screens/weather-light.png"
                  alt="Weather preview"
                  width={420}
                  height={300}
                  className="rounded-xl ring-1 ring-white/10"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center">
            {t('features.title')}
          </h2>
          <p className="mt-3 text-neutral-600 text-center">{t('features.sub')}</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {icon:'🗓️', title:t('features.cards.calendar.title'), desc:t('features.cards.calendar.desc')},
              {icon:'✅', title:t('features.cards.tasks.title'), desc:t('features.cards.tasks.desc')},
              {icon:'💸', title:t('features.cards.finance.title'), desc:t('features.cards.finance.desc')},
              {icon:'🌦️', title:t('features.cards.weather.title'), desc:t('features.cards.weather.desc')},
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 font-semibold text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16 md:py-24 bg-neutral-50">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center">
            {t('how.title')}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {step:'1', title:t('how.steps.1.t'), desc:t('how.steps.1.d')},
              {step:'2', title:t('how.steps.2.t'), desc:t('how.steps.2.d')},
              {step:'3', title:t('how.steps.3.t'), desc:t('how.steps.3.d')},
            ].map(s => (
              <div key={s.step} className="rounded-2xl border border-neutral-200 bg-white p-6">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">{s.step}</div>
                <h3 className="mt-3 font-semibold text-neutral-900">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 md:py-24 bg-white">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center">
            {t('social.title')}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {q:t('social.items.0.q'), a:'— Anna'},
              {q:t('social.items.1.q'), a:'— Mārtiņš'},
              {q:t('social.items.2.q'), a:'— Olga'},
            ].map((it, i) => (
              <blockquote key={i} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-neutral-800 italic">“{it.q}”</p>
                <footer className="mt-3 text-sm text-neutral-500">{it.a}</footer>
              </blockquote>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-10 text-center backdrop-blur">
            <h3 className="text-3xl font-bold">{t('cta.title')}</h3>
            <p className="mt-2 text-white/90">{t('cta.sub')}</p>
            <div className="mt-6 flex justify-center gap-3">
              <PrimaryButton href={`/${locale}/register`}>{t('cta.primary')}</PrimaryButton>
              <GhostButton href={`/${locale}/pricing`}>{t('cta.secondary')}</GhostButton>
            </div>
          </div>
        </Container>
      </section>
      {/* No footer here; the footer comes from (public)/layout.tsx */}
    </main>
  );
}
