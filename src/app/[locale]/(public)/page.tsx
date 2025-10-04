'use client';

import CardSwap from "@/components/CardSwap";
import Link from 'next/link';
import { useTranslations, useLocale } from '@/lib/i18n/i18n';

/* Helpers */
function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>;
}
function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold shadow-sm hover:bg-indigo-500 transition-colors"
    >
      {children}
    </Link>
  );
}
function GhostButton({
  href,
  children,
  disabled = false,
}: {
  href?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-3 transition-colors";

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={
          base +
          " border border-white/20 bg-white/5 text-white/70 opacity-60 " +
          "cursor-not-allowed pointer-events-none"
        }
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href!}
      className={
        base +
        " border border-white/30 bg-white/5 text-white hover:bg-white/10"
      }
    >
      {children}
    </Link>
  );
}
function BenefitCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="h-full rounded-3xl border border-white/20 bg-white/10 p-5 md:p-6 text-center backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,.15)] overflow-hidden">
      <h3 className="mx-auto font-extrabold tracking-tight leading-[1.15] text-balance text-[clamp(1.125rem,0.9rem+0.8vw,1.625rem)] md:max-w-[20ch] lg:max-w-[18ch]">
        {title}
      </h3>
      <p className="mx-auto mt-3 text-white/85 text-pretty text-[clamp(0.95rem,0.9rem+0.25vw,1.05rem)] md:max-w-[30ch]">
        {sub}
      </p>
    </div>
  );
}

export default function Landing() {
  const t = useTranslations('landing');
  const locale = useLocale() || 'en';

  // Bildes switcherim — pievieno vēl ierakstus, ja gribi vairāk variantu
const heroImages = [
  { src: "/images/overview_view.png",  alt: "Overview",  width: 1200, height: 760 },
  { src: "/images/weather_view.png",   alt: "Weather",   width: 1200, height: 760 },
  { src: "/images/groceries_view.png", alt: "Groceries", width: 1200, height: 760 },
];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4f46e5] via-[#6d5ae6] to-[#8b5cf6] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.22),transparent_60%)]" />
        <Container>
          {/* Mazāks vertikālais padding; uz lg joprojām plašāks */}
          <div className="pt-6 md:pt-8 lg:pt-12 pb-10 md:pb-14 lg:pb-20 grid items-center gap-6 lg:gap-10 lg:grid-cols-2">
            {/* Teksta kolonna */}
            <div>
              <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                {t('hero.eyebrow')}
              </div>

              {/* H1 ar clamp, lai mobile nebūtu gigantisks */}
              <h1 className="font-extrabold leading-[1.08] text-balance text-[clamp(2rem,1.1rem+4.2vw,4rem)]">
                {t('hero.h1')}
              </h1>

              <p className="mt-4 text-white/90 text-base sm:text-lg">{t('hero.sub')}</p>

              <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
                <PrimaryButton href={`/${locale}/register`}>{t('hero.primaryCta')}</PrimaryButton>
                <GhostButton href={`/${locale}/weather`}>{t('hero.secondaryCta')}</GhostButton>
              </div>
              <p className="mt-3 text-sm text-white/70">{t('hero.noCard')}</p>

              {/* Priekšrocības: 1 → 2 → 3 kolonnas */}
              <div className="mt-8 grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                <BenefitCard title={t('benefits.privacy.title')} sub={t('benefits.privacy.sub')} />
                <BenefitCard title={t('benefits.open.title')} sub={t('benefits.open.sub')} />
                <BenefitCard title={t('benefits.free.title')} sub={t('benefits.free.sub')} />
              </div>
            </div>

            {/* Preview kolonna — slēpta uz <md, lai netaisa “tukšumu” */}
<div className="relative hidden md:block">
  <CardSwap
    images={heroImages}
    className="p-2"                 // šeit var iedot arī w-[620px] u.c.
    buttonClassName=""             // pārraksti, ja vajag citus toņus
  />
</div>
          </div>
        </Container>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-12 md:py-16 lg:py-24 bg-white">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center">{t('features.title')}</h2>
          <p className="mt-3 text-neutral-600 text-center">{t('features.sub')}</p>

          <div className="mt-8 md:mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '🗓️', title: t('features.cards.calendar.title'), desc: t('features.cards.calendar.desc') },
              { icon: '✅', title: t('features.cards.tasks.title'), desc: t('features.cards.tasks.desc') },
              { icon: '💸', title: t('features.cards.finance.title'), desc: t('features.cards.finance.desc') },
              { icon: '🌦️', title: t('features.cards.weather.title'), desc: t('features.cards.weather.desc') },
            ].map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 font-semibold text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-12 md:py-16 lg:py-24 bg-neutral-50">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center">{t('how.title')}</h2>
          <div className="mt-8 md:mt-10 grid gap-6 md:grid-cols-3">
            {[
              { step: '1', title: t('how.steps.1.t'), desc: t('how.steps.1.d') },
              { step: '2', title: t('how.steps.2.t'), desc: t('how.steps.2.d') },
              { step: '3', title: t('how.steps.3.t'), desc: t('how.steps.3.d') },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-neutral-200 bg-white p-6">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
                  {s.step}
                </div>
                <h3 className="mt-3 font-semibold text-neutral-900">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* TESTIMONIALS — atstāts nākotnei */}
      <section className="py-12 md:py-16 lg:py-24 bg-white">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 text-center">{t('social.title')}</h2>
          <div className="mt-8 md:mt-10 grid gap-6 md:grid-cols-3">
            {[
              { q: t('social.items.0.q'), a: '— Anna' },
              { q: t('social.items.1.q'), a: '— Mārtiņš' },
              { q: t('social.items.2.q'), a: '— Olga' },
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
      <section className="py-12 md:py-16 lg:py-24">
        <Container>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-8 md:p-10 text-center backdrop-blur">
            <h3 className="text-2xl md:text-3xl font-bold">{t('cta.title')}</h3>
            <p className="mt-2 text-white/90">{t('cta.sub')}</p>
           <div className="mt-6 flex justify-center gap-3">
  <PrimaryButton href={`/${locale}/register`}>{t('cta.primary')}</PrimaryButton>
  <GhostButton disabled>{t('cta.secondary')}</GhostButton>
  {/* vai: <GhostButton href={`/${locale}/pricing`} disabled>…</GhostButton> */}
</div>
          </div>
        </Container>
      </section>
      {/* Footer nāk no globālā layouta */}
    </main>
  );
}
