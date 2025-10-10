// src/app/[locale]/(dashboard)/calendar/page.tsx

// Prisma klienta imports DB piekļuvei
import { prisma } from "@/lib/db";

// Palīgfunkcijas darbam ar mēneša datumiem un kalendāra režģi
import {
  parseMonthParam,      // nolasa ?month=YYYY-MM un atgriež Date (mēneša sākumā)
  startOfMonth,         // atgriež konkrētā mēneša 1. datumu (00:00)
  endOfMonth,           // atgriež konkrētā mēneša pēdējo dienu (23:59:59.999)
  startOfCalendarGrid,  // atgriež pirmo šūnu (pirmdienu/svētdienu) 6x7 režģim
  addDays,              // pieskaita dienas Date objektam
  monthLabel,           // izveido i18n virsraksta “2025. g. oktobris” tekstu
  ymKey,                // izveido “YYYY-MM” atslēgu salīdzināšanai
} from "@/lib/date";

// Mēneša pārslēgšanas komponenti (←/→)
import MonthSwitcher from "@/components/MonthSwitcher";

// Klienta komponents, kas renderē šūnas (ikonas, klikus) un reaģē uz live eventiem
import CalendarMonthClient from "./CalendarMonthClient";

// Autentifikācijas sesijas nolase serverī
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Noderīgs tips “YYYY-MM-DD” virknei
import type { ISODate } from "@/lib/types";

// Minimāla eventa forma kalendāra vajadzībām (ID + virsraksts + starts)
type EventLike = {
  id: string;
  title: string;
  start?: Date | null;
  startsAt?: Date | null;
};

// Galvenā lapas servera-komponente (async, jo lasa DB)
export default async function CalendarPage({
  params,
  searchParams,
}: {
  // Next.js 15 App Router: params un searchParams ir Promise (server actions pipeline)
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  // --- Autentifikācija / lietotāja ID, lai filtrētu datus pēc lietotāja ---
  const session = await getServerSession(authOptions);
  const userId =
    session?.user && (session.user as any).id
      ? Number((session.user as any).id)
      : null;

  // --- Ievades parametri (vietējā valoda + izvēlētais mēnesis) ---
  const { locale } = await params;                 // piem., "lv" vai "en"
  const { month } = await searchParams;            // piem., "2025-10"

  // --- Mēneša robežas un virsraksts ---
  const monthDate = parseMonthParam(month);        // Date mēneša kontekstam
  const label = monthLabel(monthDate, locale ?? "en");  // “2025. g. oktobris”
  const start = startOfMonth(monthDate);           // mēneša sākuma Date
  const end = endOfMonth(monthDate);               // mēneša beigu Date

  /* ---------------- Work-diary events (portfeļa ikona) ---------------- */
  // Nolasa darba dienasgrāmatas ierakstus šim mēnesim, lai parādītu 💼 ikon
  let events: EventLike[] = [];
  try {
    const dbEvents = await prisma.workDiaryEntry.findMany({
      where: {
        startAt: { gte: start, lte: end },         // tikai izvēlētajā mēnesī
        ...(userId ? { userId } : {}),             // ja ir lietotājs — filtrē pēc userId
      },
      select: { id: true, title: true, startAt: true },
      orderBy: { startAt: "asc" },
    });
    // Pārmapo uz vienkāršāku formu, ko vajag režģim
    events = dbEvents.map((e) => ({
      id: String(e.id),
      title: e.title ?? "(untitled)",
      start: e.startAt,
      startsAt: e.startAt,
    }));
  } catch {
    // Ja DB nav pieejama vai kļūda — turpinām ar tukšu
    events = [];
  }

  /* ---------------- Day colors (no DayLog) ---------------- */
  // Nolasa katras dienas krāsu (ja tāda ir), lai iekrāsotu dienas numuru
  const dayLogs = await prisma.dayLog.findMany({
    where: {
      date: { gte: start, lte: end },              // šī mēneša ietvaros
      ...(userId ? { userId } : {}),
    },
    select: { date: true, dayColor: true },
  });

  // Uzbūvējam karti: "YYYY-MM-DD" -> "#ff0000" (vai cita krāsa)
  const colorMap = new Map<string, string>();
  for (const dl of dayLogs) {
    if (!dl.dayColor) continue;                    // izlaiž, ja krāsa nav iestatīta
    const iso = dl.date.toISOString().slice(0, 10); // normalizācija uz YYYY-MM-DD
    colorMap.set(iso, dl.dayColor);
  }

  /* ---------------- To-dos ar termiņu dienā (bloknota ikona) ---------------- */
  // Nolasa neizpildītos uzdevumus, kuru termiņš ir šajā mēnesī
let todoDates = new Set<string>();
let todoPriorityByDate = new Map<string, "low" | "med" | "high">();

try {
  const todos = await prisma.todoItem.findMany({
    where: {
      ...(userId ? { userId } : {}),
      done: false,
      due: { gte: start, lte: end },
    },
    select: { due: true, priority: true }, // ⬅️ paņemam arī prioritāti
  });

  // helper: paaugstinām prioritāti, ja dienā ir vairāki todo
  const rank = (p?: string) => (String(p).toLowerCase().startsWith("h") ? 3
                      : String(p).toLowerCase().startsWith("m") ? 2 : 1);

  for (const t of todos) {
    if (!t.due) continue;
    const iso = new Date(t.due).toISOString().slice(0, 10);
    todoDates.add(iso);

    const prev = todoPriorityByDate.get(iso);
    const cur  = (String(t.priority || "med").toLowerCase() as "low" | "med" | "high");
    if (!prev || rank(cur) > rank(prev)) {
      todoPriorityByDate.set(iso, cur);
    }
  }
} catch {
  todoDates = new Set();
  todoPriorityByDate = new Map();
}

  /* ---------------- 6x7 kalendāra režģa uzbūve ---------------- */
  // Režģis vienmēr ir 42 šūnas (6 nedēļas x 7 dienas).
  const gridStart = startOfCalendarGrid(monthDate); // pirmā šūna (nedēļas sākums)
  const days = Array.from({ length: 42 }).map((_, i) => {
    const d = addDays(gridStart, i);                // attiecīgā šūnas datums
    const inMonth = ymKey(d) === ymKey(monthDate);  // vai šūna ir aktuālajā mēnesī
    // “sv-SE” lokāle dod drošu YYYY-MM-DD formātu
    const dateISO = d.toLocaleDateString("sv-SE") as ISODate;
    const day = d.getDate();                        // dienas numurs (1..31)

    // Atrodam darba-dienasgrāmatas ierakstus šai dienai, lai rādītu 💼
    const items =
      events
        .filter((e) => {
          const raw = e.start ?? e.startsAt ?? null;
          const dt = raw ? new Date(raw) : null;
          // pieskaņo pēc YYYY-MM-DD
          return !!dt && dt.toISOString().slice(0, 10) === dateISO;
        })
        .map((e) => ({ id: e.id, title: e.title })) ?? [];

    // Dienas krāsa (ja iestatīta DayLog)
    const dayColor = colorMap.get(dateISO);
    // Vai šai dienai ir kāds neizpildīts To-Do ar termiņu tajā datumā
    const hasTodos = todoDates.has(dateISO);
const todoPriority = todoPriorityByDate.get(dateISO); // ⬅️ var būt undefined
    // DTO vienas šūnas uzzīmēšanai komponentā
    return { dateISO, day, inMonth, items, dayColor, hasTodos, todoPriority };
  });

  // Nedēļas dienu īsie nosaukumi (Pirmd., Otrd., …), sākot no pirmdienas
  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 2 + i).toLocaleDateString(locale ?? "en", {
      weekday: "short",
    })
  );

  // --- Renderēšana ---
  return (
    // “Full-bleed” tikai šai lapai uz mobilā:
    // -mx-4 kompensē DashboardShell iekšējo paddingu, lai kalendārs iziet līdz ekrāna malām
    <div className="-mx-4 sm:mx-0 grid gap-2 md:gap-4">
      {/* Mēneša virsraksts + pārslēgšanas pogas */}
      <div className="mb-1 md:mb-2 flex items-center justify-center gap-2 md:gap-3">
        <MonthSwitcher direction="prev" />
        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
          {label}
        </h2>
        <MonthSwitcher direction="next" />
      </div>

      {/* “Karte” ap kalendāru: uz mobilā bez paddings/radius/ring, uz ≥md — kā iepriekš */}
      <div className="bg-white p-0 md:p-4 rounded-none md:rounded-lg shadow-none md:shadow-sm ring-0 md:ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
        {/* Klienta komponents, kas rāda 6x7 režģi, ikonas un reaģē uz eventiem */}
        <CalendarMonthClient days={days} weekdayLabels={weekdayLabels} />
      </div>

      {/* Dialogs/dienas skats (atvēršana pēc URL ?d= vai custom eventa) */}
      <CalendarClient />
    </div>
  );
}

// Lai izvairītos no “circular warnings”, šo importu turam pēc noklusētās eksportētās funkcijas
import CalendarClient from "./CalendarClient";
