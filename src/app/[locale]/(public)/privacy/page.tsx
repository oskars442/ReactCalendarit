// app/[locale]/privacy/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";

/* ── Locales & Types ── */
const LOCALES = ["lv", "en", "ru"] as const;
type Locale = (typeof LOCALES)[number];

type PrivacyContent = {
  title: string;
  effective: string;
  lastUpdated: string;
  owner: string;
  contact: string;
  law: string;
  sections: Array<{ h: string; p: string[] }>;
  emailLabel: string;
};

const PRIVACY_BY_LOCALE: Record<Locale, PrivacyContent> = {
  lv: {
    title: "🔒 Privātuma politika (Privacy Policy)",
    effective: "Stājas spēkā: [ievadi datumu]",
    lastUpdated: "Pēdējais atjauninājums: [ievadi datumu]",
    owner: "Pakalpojuma īpašnieks: Privātpersona (Liepāja, Latvija)",
    contact: "Kontaktinformācija: calendarit2025@gmail.com",
    law: "Tiesiskais regulējums: ES Vispārīgā datu aizsardzības regula (GDPR) un Latvijas Republikas likumi",
    sections: [
      {
        h: "1. Kas mēs esam",
        p: [
          "CalendarIt ir digitāla platforma personīgās dzīves un darba organizēšanai. Šī politika paskaidro, kā mēs apstrādājam personas datus, kad izmantojat **CalendarIt** (turpmāk – “Platforma”).",
          "Atbildīgā persona: **Privātpersona (Liepāja, Latvija)**. Saziņai: **calendarit2025@gmail.com**.",
        ],
      },
      {
        h: "2. Kādi datus mēs apstrādājam",
        p: [
          "Jūs sniegtie dati: vārds/uzvārds (ja norādīts), e-pasts, parole (šifrēta), dzimšanas datums/dzimums (ja norādīts).",
          "Satura dati: kalendāra notikumi, uzdevumi, darba dienasgrāmatas ieraksti, treniņi, iepirkumu saraksti, iestatījumi un statistikas dati par lietošanu.",
          "Tehniskie dati: IP adrese, pārlūka un ierīces informācija, valodas iestatījumi, kļūdu žurnāli.",
          "Sīkdatnes: šobrīd tikai **nepieciešamās** (autentifikācijai/sesijai).",
        ],
      },
      {
        h: "3. Datu izmantošanas mērķi",
        p: [
          "Pakalpojuma nodrošināšana (pierakstīšanās, datu glabāšana un sinhronizācija, moduļu darbība).",
          "Drošība un ļaunprātīgas izmantošanas novēršana (piem., piekļuves kontrole, kļūdu diagnostika).",
          "Lietotāja pieredzes uzlabošana un jaunu funkciju izstrāde.",
          "Juridisko pienākumu izpilde (ja piemērojams).",
        ],
      },
      {
        h: "4. Datu glabāšana un vieta",
        p: [
          "Datubāze: **Supabase (PostgreSQL)** – droši serveri, datu rezerves kopijas un piekļuves kontrole.",
          "Hostings: **Vercel** – lietotnes izvietošana un piekļuves žurnāli.",
          "Ārējie API: **OpenWeather** (laikapstākļu dati) un nākotnē var tikt pievienoti citi API. Šie pakalpojumi var saņemt tehnisku informāciju pieprasījumu apstrādei.",
        ],
      },
      {
        h: "5. Maksājumi (nākotnē)",
        p: [
          "Nākotnē Premium funkcijām var tikt izmantots **Stripe**. Maksājumu dati tiek apstrādāti Stripe sistēmā un **netiek glabāti** CalendarIt datubāzē.",
        ],
      },
      {
        h: "6. Analītika un sīkdatnes",
        p: [
          "Šobrīd izmantojam tikai **nepieciešamās** sīkdatnes (sesijas/autentifikācijas).",
          "Nākotnē var tikt pieslēgta **Google Analytics** analītika. Pirms analītisko sīkdatņu izmantošanas tiks nodrošināta atsevišķa piekrišana.",
        ],
      },
      {
        h: "7. Tiesiskais pamats (GDPR)",
        p: [
          "Līguma izpilde: pakalpojuma sniegšana un jūsu pieprasīto funkciju nodrošināšana.",
          "Likumīgās intereses: pakalpojuma drošība, kļūdu novēršana, uzlabojumi.",
          "Piekrišana: analītikas/nenepieciešamās sīkdatnes (ja aktivizētas nākotnē).",
          "Juridiskais pienākums: ja dati jāsaglabā vai jānodod atbilstoši likumam.",
        ],
      },
      {
        h: "8. Datu glabāšanas termiņi",
        p: [
          "Dati tiek glabāti, kamēr ir aktīvs jūsu konts vai tas ir nepieciešams mērķim, kura dēļ dati savākti. Pēc konta neatgriezeniskas dzēšanas dati tiek dzēsti no aktīvām sistēmām un rezerves kopijām saskaņā ar mūsu rezerves cikliem.",
        ],
      },
      {
        h: "9. Datu koplietošana",
        p: [
          "Mēs neizpaužam jūsu datus trešajām personām, izņemot pakalpojuma uzturēšanai nepieciešamos apstrādātājus (Supabase, Vercel, OpenWeather, Stripe u.c.) vai ja to prasa likums. Ar apstrādātājiem tiek slēgtas datu apstrādes vienošanās.",
        ],
      },
      {
        h: "10. Lietotāja tiesības",
        p: [
          "Jums ir tiesības piekļūt saviem datiem, tos labot, dzēst, ierobežot apstrādi, iebilst apstrādei un saņemt datu kopiju (**datu pārnesamība**).",
          "Lai izmantotu tiesības, rakstiet uz **calendarit2025@gmail.com**. Mēs atbildēsim 30 dienu laikā.",
          "Jums ir tiesības iesniegt sūdzību **Datu valsts inspekcijā** (www.dvi.gov.lv).",
        ],
      },
      {
        h: "11. Konta un datu dzēšana",
        p: [
          "Profilā ir pieejama **neatgriezeniska konta un datu dzēšana**. Dzēšot kontu, tiek dzēsti arī saistītie ieraksti no datubāzes, izņemot datus, kurus mums var prasīt saglabāt saskaņā ar likumu.",
        ],
      },
      {
        h: "12. Vecuma ierobežojums",
        p: [
          "Platforma paredzēta lietotājiem no **16 gadu vecuma**. Ja esat jaunāks par 16 gadiem, pakalpojumu drīkst lietot tikai ar likumiskā pārstāvja piekrišanu.",
        ],
      },
      {
        h: "13. Drošība",
        p: [
          "Izmantojam nozares labās prakses pasākumus: paroļu **šifrēšana**, piekļuves kontrole, šifrēta datu pārraide (HTTPS), rezerves kopijas un uzraudzība.",
        ],
      },
      {
        h: "14. Izmaiņas šajā politikā",
        p: [
          "Mēs varam atjaunināt šo politiku. Izmaiņas stājas spēkā, kad tās publicētas Platformā, sadaļā norādot **pēdējā atjauninājuma** datumu.",
        ],
      },
      {
        h: "15. Kontakti",
        p: [
          "Jautājumiem vai datu pieprasījumiem: **📩 calendarit2025@gmail.com**.",
        ],
      },
    ],
    emailLabel: "Rakstīt e-pastu",
  },
  en: {
    title: "🔒 Privacy Policy",
    effective: "Effective date: [insert date]",
    lastUpdated: "Last updated: [insert date]",
    owner: "Service owner: Private individual (Liepāja, Latvia)",
    contact: "Contact: calendarit2025@gmail.com",
    law: "Governing law: EU GDPR and laws of the Republic of Latvia",
    sections: [
      {
        h: "1. Who we are",
        p: [
          "CalendarIt is a digital platform for personal and work organization. This policy explains how **CalendarIt** (the “Platform”) processes personal data.",
          "Controller: **Private individual (Liepāja, Latvia)**. Contact: **calendarit2025@gmail.com**.",
        ],
      },
      {
        h: "2. Data we process",
        p: [
          "Data you provide: name/surname (if provided), email, password (hashed), date of birth/gender (if provided).",
          "Content data: calendar events, tasks, work diary entries, workouts, shopping lists, settings and usage statistics.",
          "Technical data: IP address, browser/device info, language settings, error logs.",
          "Cookies: currently only **strictly necessary** (session/auth).",
        ],
      },
      {
        h: "3. Purposes of processing",
        p: [
          "Providing the service (sign-in, storage/sync, module functionality).",
          "Security and abuse prevention (access control, diagnostics).",
          "Improving user experience and developing new features.",
          "Compliance with legal obligations (where applicable).",
        ],
      },
      {
        h: "4. Storage & location",
        p: [
          "Database: **Supabase (PostgreSQL)** with secure servers, backups and access control.",
          "Hosting: **Vercel** (deployment and access logs).",
          "Third-party APIs: **OpenWeather** (weather data) and others may be added in the future. These services may receive minimal technical data to fulfill requests.",
        ],
      },
      {
        h: "5. Payments (future)",
        p: [
          "Premium features may use **Stripe**. Payment data is processed by Stripe and **not stored** in CalendarIt databases.",
        ],
      },
      {
        h: "6. Analytics & cookies",
        p: [
          "We currently use only **necessary** cookies (session/auth).",
          "We may enable **Google Analytics** in the future. We will request consent before using analytics cookies.",
        ],
      },
      {
        h: "7. Legal bases (GDPR)",
        p: [
          "Performance of a contract: providing the requested features.",
          "Legitimate interests: security, debugging, improvements.",
          "Consent: analytics / non-essential cookies (if enabled).",
          "Legal obligation: where retention/disclosure is required by law.",
        ],
      },
      {
        h: "8. Retention",
        p: [
          "We keep data while your account is active or as needed for the purposes collected. Upon irreversible account deletion, data is removed from active systems and backups according to our backup cycles.",
        ],
      },
      {
        h: "9. Sharing",
        p: [
          "We do not sell personal data. We share it only with processors needed to run the service (Supabase, Vercel, OpenWeather, Stripe, etc.) or where required by law. Data processing agreements are in place.",
        ],
      },
      {
        h: "10. Your rights",
        p: [
          "You have the right to access, rectify, erase, restrict, object, and receive a copy of your data (**data portability**).",
          "To exercise your rights, email **calendarit2025@gmail.com**. We reply within 30 days.",
          "You may lodge a complaint with the Latvian **Data State Inspectorate** (www.dvi.gov.lv).",
        ],
      },
      {
        h: "11. Account & data deletion",
        p: [
          "A **permanent account and data deletion** action is available in your profile. Related records are removed from our databases except where we must retain data by law.",
        ],
      },
      {
        h: "12. Age",
        p: [
          "The Platform is intended for users **16 years and older**. If you are under 16, you may use the service only with consent from a legal guardian.",
        ],
      },
      {
        h: "13. Security",
        p: [
          "We apply industry practices: password **hashing**, access control, HTTPS, backups and monitoring.",
        ],
      },
      {
        h: "14. Changes",
        p: [
          "We may update this policy. Changes take effect when published on the Platform with the **last updated** date.",
        ],
      },
      {
        h: "15. Contact",
        p: ["For questions or requests: **📩 calendarit2025@gmail.com**."],
      },
    ],
    emailLabel: "Email us",
  },
  ru: {
    title: "🔒 Политика конфиденциальности",
    effective: "Вступает в силу: [укажите дату]",
    lastUpdated: "Последнее обновление: [укажите дату]",
    owner: "Владелец сервиса: Частное лицо (Лиепая, Латвия)",
    contact: "Контакты: calendarit2025@gmail.com",
    law: "Применимое право: GDPR ЕС и законы Латвийской Республики",
    sections: [
      {
        h: "1. Кто мы",
        p: [
          "CalendarIt — цифровая платформа для организации личной жизни и работы. В этой политике объясняется, как **CalendarIt** (далее — «Платформа») обрабатывает персональные данные.",
          "Оператор: **Частное лицо (Лиепая, Латвия)**. Контакт: **calendarit2025@gmail.com**.",
        ],
      },
      {
        h: "2. Какие данные обрабатываются",
        p: [
          "Предоставляемые данные: имя/фамилия (если указано), e-mail, пароль (хэш), дата рождения/пол (если указано).",
          "Контент: события календаря, задачи, записи дневника, тренировки, списки покупок, настройки и статистика использования.",
          "Технические данные: IP-адрес, информация о браузере/устройстве, язык, журналы ошибок.",
          "Файлы cookie: сейчас только **строго необходимые** (сессия/аутентификация).",
        ],
      },
      {
        h: "3. Цели обработки",
        p: [
          "Предоставление сервиса (вход, хранение/синхронизация, работа модулей).",
          "Безопасность и предотвращение злоупотреблений (контроль доступа, диагностика).",
          "Улучшение опыта и разработка новых функций.",
          "Соблюдение правовых требований (при необходимости).",
        ],
      },
      {
        h: "4. Хранение и расположение",
        p: [
          "База данных: **Supabase (PostgreSQL)** — защищённые серверы, резервные копии, контроль доступа.",
          "Хостинг: **Vercel** — деплой и журналы доступа.",
          "Сторонние API: **OpenWeather** (погода) и другие могут добавляться в будущем. Эти сервисы могут получать минимальные технические данные для обработки запросов.",
        ],
      },
      {
        h: "5. Платежи (в будущем)",
        p: [
          "Премиум-функции могут использовать **Stripe**. Платёжные данные обрабатываются Stripe и **не хранятся** в базах CalendarIt.",
        ],
      },
      {
        h: "6. Аналитика и cookie",
        p: [
          "Сейчас используются только **необходимые** cookie (сессия/аутентификация).",
          "В будущем может быть подключена **Google Analytics**. Перед использованием аналитических cookie мы запросим согласие.",
        ],
      },
      {
        h: "7. Правовые основания (GDPR)",
        p: [
          "Исполнение договора: предоставление запрошенных функций.",
          "Законные интересы: безопасность, отладка, улучшения.",
          "Согласие: аналитика / необязательные cookie (если будут включены).",
          "Юридическая обязанность: когда хранение/раскрытие требуется законом.",
        ],
      },
      {
        h: "8. Сроки хранения",
        p: [
          "Данные хранятся, пока ваш аккаунт активен, либо столько, сколько необходимо для целей сбора. После безвозвратного удаления аккаунта данные удаляются из активных систем и резервных копий по нашим циклам резервирования.",
        ],
      },
      {
        h: "9. Передача данных",
        p: [
          "Мы не продаём персональные данные. Передаём их только обработчикам, необходимым для работы сервиса (Supabase, Vercel, OpenWeather, Stripe и др.) или по требованию закона. С обработчиками заключены соглашения об обработке данных.",
        ],
      },
      {
        h: "10. Права пользователя",
        p: [
          "Вы вправе получить доступ, исправить, удалить, ограничить обработку, возразить и получить копию своих данных (**портативность данных**).",
          "Для реализации прав пишите на **calendarit2025@gmail.com**. Ответ — в течение 30 дней.",
          "Вы можете подать жалобу в **Инспекцию по защите данных Латвии** (www.dvi.gov.lv).",
        ],
      },
      {
        h: "11. Удаление аккаунта и данных",
        p: [
          "В профиле доступно **безвозвратное удаление** аккаунта и данных. Связанные записи удаляются из баз данных, кроме случаев, когда закон требует их хранения.",
        ],
      },
      {
        h: "12. Возраст",
        p: [
          "Платформа предназначена для пользователей **от 16 лет**. Если вам меньше 16, используйте сервис только с согласия законного представителя.",
        ],
      },
      {
        h: "13. Безопасность",
        p: [
          "Мы применяем отраслевые практики: **хэширование** паролей, контроль доступа, HTTPS, резервное копирование и мониторинг.",
        ],
      },
      {
        h: "14. Изменения политики",
        p: [
          "Мы можем обновлять эту политику. Изменения вступают в силу при публикации на Платформе с указанием даты **последнего обновления**.",
        ],
      },
      {
        h: "15. Контакты",
        p: ["По вопросам и запросам: **📩 calendarit2025@gmail.com**."],
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

/* ── Metadata ── */
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const l = (params.locale as Locale) || "lv";
  const title =
    l === "lv" ? "Privātuma politika | CalendarIt" :
    l === "ru" ? "Политика конфиденциальности | CalendarIt" :
    "Privacy Policy | CalendarIt";

  const description =
    l === "lv"
      ? "CalendarIt privātuma politika — kādi dati tiek vākti, kā tie tiek izmantoti un jūsu GDPR tiesības."
      : l === "ru"
      ? "Политика конфиденциальности CalendarIt — какие данные собираются, как используются и ваши права по GDPR."
      : "CalendarIt Privacy Policy — what data we collect, how we use it, and your GDPR rights.";

  return { title, description };
}

/* ── Page ── */
export default function PrivacyPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  if (!["lv", "en", "ru"].includes(locale)) notFound();

  const t = PRIVACY_BY_LOCALE[locale];
  const toc = t.sections.map((s) => ({ id: slugify(s.h), label: s.h.replace(/^\d+\.\s*/, "") }));

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-neutral-200/60 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-sky-500/10 dark:from-indigo-600/10 dark:via-fuchsia-600/10 dark:to-sky-600/10">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {t.title.replace("🔒 ", "")}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <MetaChip>📅 {t.effective}</MetaChip>
            <MetaChip>🕓 {t.lastUpdated}</MetaChip>
            <MetaChip>👤 {t.owner}</MetaChip>
            <MetaChip>⚖️ {t.law}</MetaChip>
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
                <h2 className="mt-8 mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200/50 pb-1">
                  {s.h}
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
