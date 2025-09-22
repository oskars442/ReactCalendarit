import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — CalendarIt",
  description:
    "We’re building the simplest way to plan your day, track money, and stay on top of the weather — all in one place.",
};

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
  return (
    <main className="text-neutral-900">
      {/* HERO */}
      <section className="relative isolate overflow-hidden text-white py-24 md:py-28 bg-gradient-to-b from-[#4f46e5] via-[#6d5ae6] to-[#8b5cf6]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_300px_at_20%_-5%,rgba(255,255,255,0.25),transparent_60%),radial-gradient(700px_280px_at_80%_-10%,rgba(255,255,255,0.18),transparent_60%)]" />
        <Container>
          <div className="relative z-10 flex min-h-[40vh] flex-col items-center justify-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm">
              ✨ Meet the team &amp; our story
            </span>

            <h1 className="text-center text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
              About <span className="opacity-95">CalendarIt</span>
            </h1>

            <p className="mt-4 max-w-3xl text-center text-white/90 text-lg">
              We’re building the <strong>all-in-one life hub</strong> that helps you plan tasks,
              track money, keep a calendar, and check the weather — beautifully integrated and
              pleasantly simple.
            </p>

            <div className="mt-10 grid w-full gap-4 sm:grid-cols-3 lg:max-w-3xl">
              <Stat value="10k+" label="Users" />
              <Stat value="4.8★" label="Average rating" />
              <Stat value="99.9%" label="Uptime last 12 months" />
            </div>
          </div>
        </Container>
      </section>

      {/* MISSION / WHAT WE DO */}
      <section className="bg-white py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Our Mission</h2>
            <p className="mt-4 text-neutral-600">
              Little improvements compound into big outcomes. CalendarIt turns everyday routines
              into meaningful progress by bringing your <strong>schedule</strong>,{" "}
              <strong>to-dos</strong>, <strong>money</strong>, and <strong>weather</strong> — into
              one calm, cohesive place.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Plan with clarity",
                desc: "Clean views for calendar and tasks so you always know what’s next.",
                icon: "🗓️",
              },
              {
                title: "Track what matters",
                desc: "Simple finance tracking and insights to help you make smarter decisions.",
                icon: "💸",
              },
              {
                title: "Stay weather-aware",
                desc: "Weather cards inline with your day to avoid surprises and plan better.",
                icon: "🌦️",
              },
              {
                title: "Fast & delightful",
                desc: "A modern, responsive experience with a focus on speed, clarity, and comfort.",
                icon: "⚡",
              },
              {
                title: "Privacy-first",
                desc: "Your data is yours. We store the minimum and put you in control.",
                icon: "🔒",
              },
              {
                title: "Built with care",
                desc: "Small details, well-chosen defaults, and thoughtful integrations.",
                icon: "✨",
              },
            ].map((f) => (
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
            <h2 className="text-3xl font-bold sm:text-4xl">What We Value</h2>
            <p className="mt-4 text-neutral-600">Principles that shape every feature and every pixel.</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Simplicity over everything",
                desc: "Tools should feel invisible. We remove friction until only the useful remains.",
              },
              {
                title: "Respect for your time",
                desc: "Fast, predictable interactions that help you get in and out quickly.",
              },
              {
                title: "Thoughtful defaults",
                desc: "Smart presets that work out of the box, with power when you want it.",
              },
              {
                title: "Trust & privacy",
                desc: "We earn your trust by protecting your data and communicating clearly.",
              },
            ].map((v) => (
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
            <h2 className="text-3xl font-bold sm:text-4xl">How We Got Here</h2>
            <p className="mt-4 text-neutral-600">A short story of small steps, shipped consistently.</p>
          </div>

          <ol className="relative mx-auto mt-10 max-w-3xl border-l border-neutral-200">
            {[
              {
                year: "2024",
                title: "The idea",
                body: "A personal need for a calmer planner sparks the first prototypes.",
              },
              {
                year: "2025",
                title: "Public beta",
                body: "Calendar, tasks and weather come together with a new design language.",
              },
              {
                year: "2025–now",
                title: "Integrations & insights",
                body: "Finance tracking and helpful insights make planning even smarter.",
              },
            ].map((t) => (
              <li key={t.title} className="mb-8 ml-6">
                <span className="absolute -left-3 mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600">
                  ●
                </span>
                <h3 className="font-semibold text-neutral-900">
                  {t.year} — {t.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">{t.body}</p>
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
            <h3 className="text-3xl font-bold sm:text-4xl">Say hello 👋</h3>
            <p className="mx-auto max-w-2xl text-white/90">
              Have questions, ideas, or want to collaborate? We’d love to hear from you.
            </p>
            <div>
              <a
                href="mailto:calendarit2025@gmail.com"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-semibold text-indigo-700 shadow-sm transition hover:bg-white/90"
              >
                Contact us
              </a>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
