// app/[locale]/terms/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";

/* ── Locales & Types ── */
const LOCALES = ["lv", "en", "ru"] as const;
type Locale = (typeof LOCALES)[number];

type TermsContent = {
  title: string;
  entersIntoForce: string;
  lastUpdated: string;
  owner: string;
  contact: string;
  law: string;
  sections: Array<{ h: string; p: string[] }>;
  emailLabel: string;
};

/* ── Translations ── */
const TERMS_BY_LOCALE: Record<Locale, TermsContent> = {
  lv: {
    title: "📘 Lietošanas noteikumi (Terms of Use)",
    entersIntoForce: "Stājas spēkā: 28.10.2025",
    lastUpdated: "Pēdējoreiz atjaunots: 28.10.2025",
    owner: "Pakalpojuma īpašnieks: Privātpersona",
    contact: "Kontaktinformācija: calendarit2025@gmail.com",
    law: "Tiesiskais regulējums: Latvijas Republikas likumi",
    sections: [
      {
        h: "1. Vispārīgie noteikumi",
        p: [
          'Šie lietošanas noteikumi nosaka kārtību, kādā tiek lietota vietne **CalendarIt** (turpmāk – "Platforma").',
          "Izmantojot Platformu, jūs apliecināt, ka esat iepazinies ar šiem noteikumiem un piekrītat tiem.",
          "Ja nepiekrītat kādam no noteikumiem, lūdzu, nelietojiet Platformu.",
        ],
      },
      {
        h: "2. Pakalpojuma apraksts",
        p: [
          "CalendarIt ir digitāla platforma personīgās dzīves un darba organizēšanai, kas piedāvā:",
          "📅 Kalendāru — uzdevumu un notikumu plānošanai;",
          "🧾 Darba dienasgrāmatu — ikdienas ierakstiem un aktivitāšu fiksēšanai;",
          "✅ Uzdevumu sarakstus;",
          "🏋️ Treniņu uzskaiti;",
          "🛒 Iepirkumu sarakstus;",
          "🌤️ Laikapstākļu pārskatu;",
          "(Papildu moduļi nākotnē: Projekti, Mazuļa izsekošana);",
          "💎 Statistikas moduli (Premium) – maksas funkcija, kas pieejama abonentiem.",
          "Platforma tiek regulāri pilnveidota un var tikt papildināta ar jaunām iespējām.",
        ],
      },
      {
        h: "3. Lietotāju reģistrācija un konti",
        p: [
          "Reģistrācija ir nepieciešama, lai piekļūtu personalizētām funkcijām (piem., kalendāram, uzdevumiem, darba dienasgrāmatai).",
          "Lietotājam jānorāda pareiza un aktuāla informācija.",
          "Lietotājs ir atbildīgs par savu piekļuves datu drošību un nedrīkst tos izpaust trešajām personām.",
          "Ja tiek konstatēta nesankcionēta piekļuve, lietotājs par to nekavējoties informē CalendarIt.",
        ],
      },
      {
        h: "4. Premium saturs un maksājumi",
        p: [
          "Lielākā daļa Platformas funkciju ir bezmaksas.",
          "Dažas sadaļas (piem., Statistika) nākotnē var būt pieejamas tikai ar maksas abonementu.",
          "Maksas plāni un cenas tiks skaidri norādītas pirms apmaksas.",
          "Veiktie maksājumi netiek atmaksāti, izņemot gadījumos, kad to paredz likums.",
        ],
      },
      {
        h: "5. Lietotāja pienākumi",
        p: [
          "Lietotājs apņemas:",
          "— neizmantot Platformu prettiesiskām darbībām;",
          "— neievietot saturu, kas pārkāpj autortiesības, aizskar citus lietotājus vai satur maldinošu informāciju;",
          "— ievērot cieņu pret citiem lietotājiem un autoriem;",
          "— neizmantot automatizētus skriptus vai robotus Platformas darbības traucēšanai.",
        ],
      },
      {
        h: "6. Datu drošība un privātums",
        p: [
          "Lietotāju dati tiek apstrādāti saskaņā ar CalendarIt Privātuma politiku, kas pieejama atsevišķi.",
          "Lietotājs piekrīt, ka dati (piem., ievadītie notikumi, uzdevumi, dienasgrāmatas ieraksti) tiek glabāti drošā datubāzē un izmantoti tikai pakalpojuma nodrošināšanai.",
        ],
      },
      {
        h: "7. Atbildības ierobežojums",
        p: [
          'Platforma tiek nodrošināta "tāda, kāda tā ir" (angl. *as is*).',
          "CalendarIt nenes atbildību par datu zudumu, sistēmas pārtraukumiem vai neprecīziem ārējiem datiem (piem., laikapstākļu prognozēm).",
          "Lietotājs pats ir atbildīgs par savu datu dublēšanu un uzglabāšanu.",
        ],
      },
      {
        h: "8. Izmaiņas un darbības pārtraukšana",
        p: [
          "CalendarIt patur tiesības jebkurā laikā:",
          "— mainīt šos noteikumus;",
          "— pārtraukt vai ierobežot noteiktu funkciju darbību;",
          "— uz laiku slēgt piekļuvi Platformai tehnisku iemeslu dēļ.",
          "Izmaiņas stājas spēkā brīdī, kad tās tiek publicētas vietnē.",
        ],
      },
      {
        h: "9. Intelektuālais īpašums",
        p: [
          "Visas tiesības uz CalendarIt dizainu, kodu, zīmolu un saturu pieder tā īpašniekam.",
          "Bez rakstiskas atļaujas ir aizliegta jebkāda satura kopēšana, pārpublicēšana vai modificēšana.",
        ],
      },
      {
        h: "10. Strīdu risināšana",
        p: [
          "Visi strīdi, kas saistīti ar šo noteikumu piemērošanu, tiks risināti saskaņā ar Latvijas Republikas tiesību aktiem.",
          "Ja iespējams, puses vispirms cenšas panākt vienošanos sarunu ceļā.",
        ],
      },
      {
        h: "11. Kontakti",
        p: ["Jautājumu vai sūdzību gadījumā, lūdzu, rakstiet uz:", "📩 calendarit2025@gmail.com"],
      },
    ],
    emailLabel: "Rakstīt e-pastu",
  },
  en: {
    title: "📘 Terms of Use",
    entersIntoForce: "Effective date: 28.10.2025",
    lastUpdated: "Last updated: 28.10.2025",
    owner: "Service owner: Private individual",
    contact: "Contact: calendarit2025@gmail.com",
    law: "Governing law: Republic of Latvia",
    sections: [
      {
        h: "1. General",
        p: [
          'These Terms of Use govern the use of the **CalendarIt** website (the "Platform").',
          "By using the Platform, you confirm that you have read and agree to these Terms.",
          "If you do not agree, please do not use the Platform.",
        ],
      },
      {
        h: "2. Service Description",
        p: [
          "CalendarIt is a digital platform for personal and work organization offering:",
          "📅 Calendar — planning tasks and events;",
          "🧾 Work diary — logging daily notes and activities;",
          "✅ To-do lists;",
          "🏋️ Workout tracking;",
          "🛒 Shopping lists;",
          "🌤️ Weather overview;",
          "(Future modules: Projects, Baby tracking);",
          "💎 Statistics (Premium) — paid feature for subscribers.",
          "The Platform is continuously improved and may be updated with new features.",
        ],
      },
      {
        h: "3. Registration & Accounts",
        p: [
          "Registration is required to access personalized features (e.g., calendar, tasks, diary).",
          "You must provide accurate and up-to-date information.",
          "You are responsible for safeguarding your login credentials and must not share them.",
          "If you suspect unauthorized access, notify CalendarIt immediately.",
        ],
      },
      {
        h: "4. Premium & Payments",
        p: [
          "Most features are free.",
          "Some sections (e.g., Statistics) may be available only with a paid subscription.",
          "Plans and pricing will be shown clearly before payment.",
          "Payments are non-refundable unless required by law.",
        ],
      },
      {
        h: "5. User Obligations",
        p: [
          "You agree to:",
          "— not use the Platform for unlawful activities;",
          "— not post content that infringes IP rights, harms others, or is misleading;",
          "— treat other users and authors with respect;",
          "— not use bots or scripts to disrupt the Platform.",
        ],
      },
      {
        h: "6. Data & Privacy",
        p: [
          "User data is processed under the separate CalendarIt Privacy Policy.",
          "You consent that data (e.g., events, tasks, diary entries) is stored securely and used only to provide the service.",
        ],
      },
      {
        h: "7. Liability",
        p: [
          "The Platform is provided “as is”.",
          "CalendarIt is not liable for data loss, outages, or inaccuracies in external data (e.g., weather forecasts).",
          "You are responsible for backing up your data.",
        ],
      },
      {
        h: "8. Changes & Suspension",
        p: [
          "CalendarIt may at any time:",
          "— modify these Terms;",
          "— discontinue or limit certain features;",
          "— temporarily restrict access for technical reasons.",
          "Changes take effect when published on the website.",
        ],
      },
      {
        h: "9. Intellectual Property",
        p: [
          "All rights to the CalendarIt design, code, brand, and content belong to the owner.",
          "Copying, republication, or modification without written consent is prohibited.",
        ],
      },
      {
        h: "10. Dispute Resolution",
        p: [
          "Disputes are governed by the laws of the Republic of Latvia.",
          "Parties shall first attempt to resolve disputes amicably.",
        ],
      },
      {
        h: "11. Contacts",
        p: ["For questions or complaints, please write to:", "📩 calendarit2025@gmail.com"],
      },
    ],
    emailLabel: "Email us",
  },
  ru: {
    title: "📘 Условия использования",
    entersIntoForce: "Вступает в силу: 28.10.2025",
    lastUpdated: "Последнее обновление: 28.10.2025",
    owner: "Владелец сервиса: Частное лицо",
    contact: "Контакты: calendarit2025@gmail.com",
    law: "Применимое право: Латвийская Республика",
    sections: [
      {
        h: "1. Общие положения",
        p: [
          'Настоящие Условия использования регулируют порядок работы сайта **CalendarIt** (далее — "Платформа").',
          "Пользуясь Платформой, вы подтверждаете, что ознакомлены с настоящими условиями и соглашаетесь с ними.",
          "Если вы не согласны, пожалуйста, не пользуйтесь Платформой.",
        ],
      },
      {
        h: "2. Описание сервиса",
        p: [
          "CalendarIt — цифровая платформа для организации личной жизни и работы, предлагающая:",
          "📅 Календарь — планирование задач и событий;",
          "🧾 Рабочий дневник — ежедневные записи и активности;",
          "✅ Списки задач;",
          "🏋️ Учёт тренировок;",
          "🛒 Списки покупок;",
          "🌤️ Обзор погоды;",
          "(Будущие модули: Проекты, Отслеживание малыша);",
          "💎 Модуль статистики (Premium) — платная функция по подписке.",
          "Платформа регулярно улучшается и дополняется новыми возможностями.",
        ],
      },
      {
        h: "3. Регистрация и аккаунты",
        p: [
          "Регистрация необходима для доступа к персонализированным функциям (календарь, задачи, дневник).",
          "Пользователь обязан указывать корректную и актуальную информацию.",
          "Пользователь отвечает за сохранность своих данных доступа и не должен передавать их третьим лицам.",
          "При подозрении на несанкционированный доступ незамедлительно уведомьте CalendarIt.",
        ],
      },
      {
        h: "4. Premium и платежи",
        p: [
          "Большинство функций бесплатны.",
          "Некоторые разделы (например, статистика) могут быть доступны только по платной подписке.",
          "Тарифы и цены будут чётко указаны до оплаты.",
          "Платежи не возвращаются, кроме случаев, предусмотренных законом.",
        ],
      },
      {
        h: "5. Обязанности пользователя",
        p: [
          "Пользователь обязуется:",
          "— не использовать Платформу в противоправных целях;",
          "— не размещать контент, нарушающий права ИС, оскорбляющий других или вводящий в заблуждение;",
          "— уважительно относиться к другим пользователям и авторам;",
          "— не использовать ботов/скрипты для нарушения работы Платформы.",
        ],
      },
      {
        h: "6. Защита данных и конфиденциальность",
        p: [
          "Данные обрабатываются в соответствии с отдельной Политикой конфиденциальности.",
          "Пользователь соглашается, что данные (события, задачи, записи) хранятся безопасно и используются только для оказания услуги.",
        ],
      },
      {
        h: "7. Ограничение ответственности",
        p: [
          "Платформа предоставляется «как есть».",
          "CalendarIt не несёт ответственности за утрату данных, простои или неточность внешних данных (напр., прогноз погоды).",
          "Пользователь сам отвечает за резервное копирование своих данных.",
        ],
      },
      {
        h: "8. Изменения и приостановка",
        p: [
          "CalendarIt вправе:",
          "— изменять настоящие условия;",
          "— ограничивать или прекращать работу отдельных функций;",
          "— временно ограничивать доступ по техническим причинам.",
          "Изменения вступают в силу с момента публикации.",
        ],
      },
      {
        h: "9. Интеллектуальная собственность",
        p: [
          "Все права на дизайн, код, бренд и контент CalendarIt принадлежат владельцу.",
          "Копирование, публикация или модификация без письменного согласия запрещены.",
        ],
      },
      {
        h: "10. Урегулирование споров",
        p: [
          "Споры регулируются законодательством Латвийской Республики.",
          "Стороны сначала стремятся урегулировать спор мирно.",
        ],
      },
      {
        h: "11. Контакты",
        p: ["По вопросам и жалобам пишите:", "📩 calendarit2025@gmail.com"],
      },
    ],
    emailLabel: "Написать e-mail",
  },
};

/* ── Utils ── */
function slugify(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/(^-|-$)/g, "");
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs text-neutral-700 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
      {children}
    </span>
  );
}

/* ── Metadata per locale (Server Component-safe) ── */
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const l = (params.locale as Locale) || "lv";
  const title =
    l === "lv" ? "Lietošanas noteikumi | CalendarIt" :
    l === "ru" ? "Условия использования | CalendarIt" :
    "Terms of Use | CalendarIt";

  const description =
    l === "lv"
      ? "CalendarIt lietošanas noteikumi — vispārīgie noteikumi, datu aizsardzība, atbildība un intelektuālais īpašums."
      : l === "ru"
      ? "Условия использования CalendarIt — общие положения, конфиденциальность, ответственность и интеллектуальная собственность."
      : "CalendarIt Terms of Use — general terms, privacy, liability and intellectual property.";

  return { title, description };
}

/* ── Page ── */
export default function TermsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  if (!LOCALES.includes(locale)) notFound();

  const t = TERMS_BY_LOCALE[locale];
  const toc = t.sections.map((s) => ({ id: slugify(s.h), label: s.h.replace(/^\d+\.\s*/, "") }));

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-neutral-200/60 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-sky-500/10 dark:from-indigo-600/10 dark:via-fuchsia-600/10 dark:to-sky-600/10">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {t.title.replace("📘 ", "")}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <MetaChip>{t.entersIntoForce}</MetaChip>
            <MetaChip>{t.lastUpdated}</MetaChip>
            <MetaChip>{t.owner}</MetaChip>
            <MetaChip>{t.law}</MetaChip>
          </div>
        </div>
      </section>

      {/* Content + TOC */}
      <section className="mx-auto max-w-5xl px-4 py-10 lg:grid lg:grid-cols-[1fr_260px] lg:gap-10 print:py-4">
        <article className="prose prose-neutral max-w-3xl text-pretty leading-relaxed dark:prose-invert print:max-w-none">

          {t.sections.map((s) => {
            const id = slugify(s.h);
            return (
              <section key={id} id={id} className="scroll-mt-24">
                <h2
  className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200/50 pb-1"
>
                  <span>{s.h}</span>
                  <a
                    href={`#${id}`}
                    className="opacity-0 transition group-hover:opacity-100 text-sm no-underline"
                    aria-label="Anchor link"
                  >
                    #
                  </a>
                </h2>
                {s.p.map((para, i) => (
                  <p
                    key={i}
                    dangerouslySetInnerHTML={{
                      __html: para.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                ))}
              </section>
            );
          })}

          <div className="mt-10">
            <a
              href="mailto:calendarit2025@gmail.com"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              ✉︎ {t.emailLabel}: calendarit2025@gmail.com
            </a>
          </div>
        </article>

        <aside className="mt-8 hidden lg:block print:hidden">
          <div className="sticky top-24 rounded-xl border border-neutral-200 p-4 shadow-sm dark:border-neutral-800">
            <p className="mb-3 text-sm font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">
              {locale === "lv" ? "Saturs" : locale === "ru" ? "Содержание" : "Contents"}
            </p>
            <nav className="space-y-2 text-sm">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </section>
    </main>
  );
}

/* ── Static Params ── */
export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l }));
}
