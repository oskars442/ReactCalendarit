// src/features/overview/quotes.ts
export type Quote = { text: string; author: string };

const lv: Quote[] = [
  { text: "Katru dienu ir jauna iespēja.", author: "Nezināms" },
  { text: "Tici sev – tas ir sākums.", author: "Nezināms" },
  { text: "Darbi runā skaļāk par vārdiem.", author: "Nezināms" },
  { text: "Kas zin, ko grib – spēj, ko grib.", author: "Rainis" },
  { text: "Domas ir spēki,\nKo tu domā,\nTas tu esi.", author: "Rainis" },
  { text: "Ņem visu, kā tas ir, un padari visu, kā tu gribi.", author: "Rainis" },
  {
    text:
      "Laime var vāju samaitāt, nelaime stipru spēcināt.\nVisu, kas no ārpasaules tev nāk pretī, izlieto savas dzīves uzbūvei.",
    author: "Rainis",
  },
  {
    text:
      "Ļauj, lai darbs tevi māca. Kad tu būsi viņu uzvarējis, tad varēsi viņu mācīt.",
    author: "Anna Brigadere",
  },
  {
    text:
      "Ja nevari darīt to, kas tev patīk, tad lai tev iepatīkas tas, ko tu dari.",
    author: "Angļu sakāmvārds",
  },
  { text: "Ja nevari to, ko gribi, gribi to, ko vari.", author: "Leonardo da Vinči" },
  {
    text:
      "Tu nevari būt drošs par minūti, tāpēc nepalaid garām stundu.",
    author: "Lions Feihtvangers",
  },
  {
    text:
      "Stipras gribas cilvēks un ūdenskritums paši lauž sev ceļu.",
    author: "Angļu sakāmvārds",
  },
  {
    text:
      "Cilvēks atklāj sevi, kad mērojas spēkiem ar šķērsli.",
    author: "Antuāns de Sent-Ekziperī",
  },
  {
    text:
      "Lai ar mani notiek nevis tas, kā man gribētos, bet tas, kas man nāks par labu.",
    author: "Menandrs",
  },
  {
    text:
      "Ja kaut kas nākas grūti, tad tas ir viens iemesls vairāk, lai to izdarītu.",
    author: "Aksels Munte",
  },
  {
    text:
      "Uzslavu bieži atraida tādēļ, lai dzirdētu to vēlreiz.",
    author: "H. Longfello",
  },
  { text: "Sīks ir tas prieks, kas nekad neapnīk.", author: "Viljams Bleiks" },
  { text: "Domāt nozīmē no jauna radīt pasauli.", author: "Albērs Kamī" },
  { text: "Kas darbu dara, tas klusē, un darbs par viņu runā.", author: "Rainis" },
  {
    text:
      "Lai saprastu, ka debesis visur ir zilas, nav vajadzīgs apceļot pasauli.",
    author: "V. Gēte",
  },
  {
    text:
      "Nekad nav par vēlu kļūt par to, par ko kādreiz esi gribējis kļūt.",
    author: "Dž. Eliots",
  },
  {
    text:
      "Cerība uz rītdienu ir aizraujoša, kamēr šodiena nav kļuvusi par vakardienu.",
    author: "V. Folkners",
  },
  {
    text:
      "Ne pagātnē nogrimt, ne nākotnē vērties,\nTik mirklī dzīvot – lūk, atslēga mieram.",
    author: "Omars Haijāms",
  },
  {
    text:
      "Cerība ir iekš tevis paša,\nTava cerība būs vienīgi tava sirds.",
    author: "Rainis",
  },
  {
    text:
      "Krietns cilvēks ir drošs tikai tik, cik jūtas, stāvot uz savas pārliecības.",
    author: "Jānis Rainis",
  },
  { text: "Visi stiprie cilvēki mīl dzīvi.", author: "H. Heine" },
  {
    text:
      "Visskaistākais ir taisnība, vislabākais – veselība, vispatīkamākais ir sasniegt to, ko katrs vēlas.",
    author: "Aristotelis",
  },
  {
    text:
      "Vienīgais ierobežojums mūsu rītdienas realizācijai ir šodienas šaubas.",
    author: "Franklins D. Rūzvelts",
  },
  {
    text:
      "Beigās svarīgs nav tas, cik daudz gadu ir tavā dzīvē, bet gan tas, cik daudz dzīves ir tavos gados.",
    author: "Ābrahams Linkolns",
  },
  { text: "Labākais veids, kā paredzēt nākotni, ir to izgudrot.", author: "Alans Kejs" },
  { text: "Tu palaid garām 100% no metieniem, kurus neizdari.", author: "Veins Greckis" },
  {
    text:
      "Lielākā slava dzīvē nav nekad nenokrist, bet piecelties katru reizi, kad krīti.",
    author: "Nelsons Mandela",
  },
  {
    text:
      "Panākumi nav galīgi, neveiksmes nav liktenīgas: svarīga ir drosme turpināt.",
    author: "Vinstons Čērčils",
  },
  {
    text:
      "Vienīgais veids, kā paveikt lielisku darbu, ir mīlēt to, ko dari.",
    author: "Stīvs Džobss",
  },
  { text: "Nav svarīgi, cik lēni tu ej, kamēr tu neapstājies.", author: "Konfūcijs" },
  { text: "Ja ceļu esi atradis, arī galamērķis redzams.", author: "Krievu sakāmvārds" },
  {
    text:
      "Daudzi cenšas redzēt to, kas atrodas aiz tālām jūrām, turpretī noniecina visu, kas ir viņu acu priekšā.",
    author: "Plīnijs Jaunākais",
  },
  {
    text:
      "Iziet cauri pasaulei, nedarot sevi pilnīgāku, ir tas pats, kas inākt no pirts netīram.",
    author: "Ališers Navoji",
  },
  { text: "Ceļš vienmēr ir labāks nekā iebraucamā vieta.", author: "M. Servantess" },
];

// (Optional) minimal EN/RU fallbacks
const en: Quote[] = [
  { text: "The best time to start was yesterday. The next best is now.", author: "Unknown" },
];
const ru: Quote[] = [
  { text: "Верь в себя — и у тебя всё получится.", author: "Неизвестный" },
];

// Group by locale
const QUOTES: Record<string, Quote[]> = { lv, en, ru };

// --- helper to pick a deterministic “quote of the day” (Europe/Riga) ---
function hashString(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return Math.abs(h);
}
function rigaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // "YYYY-MM-DD"
}
export function quoteOfTheDay(locale: string, date = new Date()): Quote {
  const list = QUOTES[locale] ?? QUOTES.en;
  const idx = hashString(rigaDateKey(date)) % list.length;
  return list[idx];
}
