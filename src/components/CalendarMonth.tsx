// src/components/CalendarMonth.tsx
"use client"; // norāda Next.js, ka šis ir klienta (browser) komponents

// ----- Datu tipi, ko izmanto dienas šūnās -----

// Minimāls "darba dienasgrāmatas" ieraksta tips (mēs kalendārā rādām tikai, ka ir kāds ieraksts)
type DayItem = { id: string; title: string };

// Vienas kalendāra dienas (šūnas) datu modelis
type Day = {
  dateISO: string;
  day: number;
  inMonth: boolean;
  items: DayItem[];
  dayColor?: string;
  hasTodos?: boolean;
  todoPriority?: "low" | "med" | "high"; // ⬅️ pievienots
};


function todoBorderClass(p?: "low" | "med" | "high") {
  switch (p) {
    case "high": return "border-rose-500";
    case "med":  return "border-amber-500";
    case "low":  return "border-emerald-500";
    default:     return "border-emerald-500"; // ja nav zināms, paliek zaļš
  }
}

function IconCircle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex h-6 w-6 items-center justify-center rounded-full border bg-white",
        "text-[13px] leading-none",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
// ----- Galvenais mēneša režģa komponents -----

export default function CalendarMonth({
  days,            // 42 šūnas (6 nedēļas x 7 dienas) ar datiem vizualizācijai
  weekdayLabels,   // nedēļas dienu nosaukumi (īsie: Pirmd., Otrd., …) 7 gab.
  onOpenDate,      // callback, ko izsauc, kad lietotājs noklikšķina uz šūnas (atvērt dienu / dialogu)
  recurringDates,  // ISO datumu kopa, kur ir atkārtojoši notikumi (ikona 🎉)
}: {
  days: Day[];
  weekdayLabels: string[];
  onOpenDate?: (iso: string) => void;
  recurringDates?: Set<string>;
}) {
  // Šodienas datums ISO formātā, lai varētu izcelt šodienas šūnu (zils “ring”)
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="w-full">
      {/* ---------- Nedēļas dienu galviņa (rinda virs režģa) ---------- */}
      <div className="mb-1 md:mb-2 grid grid-cols-7 gap-0 md:gap-2">
        {weekdayLabels.map((lbl, i) => {
          // kolonnas indekss 5/6 → sestdiena/svētdiena (weekend)
          const isWeekendCol = i === 5 || i === 6;
          return (
            <div
              key={lbl + i}
              className={
                // Uz mob: kantainas galviņas, mazāks vertikālais padding un fonts;
                // Uz ≥md: noapaļotas un nedaudz lielākas.
                "rounded-none md:rounded-md py-1 md:py-2 text-center text-[11px] md:text-sm font-semibold " +
                // Atšķir fona/teksta krāsu brīvdienu kolonnām
                (isWeekendCol
                  ? "bg-rose-50/60 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                  : "bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:text-gray-300")
              }
              title={lbl} // pilnais nosaukums kā tooltips
            >
              {lbl}
            </div>
          );
        })}
      </div>

      {/* ---------- 6x7 dienu režģis (vienmēr 42 šūnas) ---------- */}
      <div className="grid grid-cols-7 gap-0 md:gap-2">
        {days.map(({ dateISO, day, inMonth, items, dayColor, hasTodos, todoPriority }, idx) => {
          // aprēķinam kolonnas indeksu (0..6), lai varētu iekrāsot brīvdienu kolonnas
          const col = idx % 7;
          const isWeekendCol = col === 5 || col === 6;
          // vai konkrētā šūna ir šodienas datums
          const isToday = dateISO === todayISO;

          // Bāzes klases vienai šūnai (responsīvi – atšķirīga forma/izmēri uz mob/desktop)
          const base =
            [
              "relative", // ļauj pozicionēt iekšējos elementus, ja vajag
              // Uz mobilā šūna tiek veidota kvadrātiska (blīvāka), uz ≥md brīvāka augstumā
              "aspect-square md:aspect-auto",
              "min-h-0 md:min-h-28",     // mob: bez obligāta augstuma; md+: vismaz ~7rem
              "rounded-none md:rounded-xl", // mob: bez radius; md+: noapaļotas šūnas
              "border",                   // smalka robeža ap šūnu
              "p-0.5 md:p-3",            // mob: ļoti mazs iekšējais padding; md+: ērtāks
              "transition-all text-left", // nelielas pārejas hover/focus stāvokļiem
              "flex flex-col",           // vertikāls izvietojums (cipars augšā, ikonas apakšā)
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400", // piekļūstamība ar klaviatūru
            ].join(" ");

          // Fona/robežu tēma, atkarībā no tā, vai šūna pieder aktīvajam mēnesim
          const monthTint = inMonth
            ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            : "bg-gray-50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-800/60 opacity-80";

          // Brīvdienu kolonām piešķiram ļoti vieglu fonu, ja ir aktīvais mēnesis
          const weekendTint =
            isWeekendCol && inMonth ? "bg-rose-50/40 dark:bg-rose-900/10" : "";

          // Šodienai piešķiram zilu gredzenu (ring) un vieglu ēnu
          const todayRing = isToday ? "ring-2 ring-sky-400 dark:ring-sky-500 shadow-sm" : "";

          // Dienas cipara teksta krāsa: šodiena – zils; citādi – normāla
          const defaultNumClass =
            isToday ? "text-sky-700 dark:text-sky-300" : "text-gray-900 dark:text-gray-100";

          // Ērtības karogi ikonām
          const hasDiary = (items?.length ?? 0) > 0;               // 💼
          const hasRecurring = recurringDates?.has(dateISO) ?? false; // 🎉

          return (
            <button
              key={dateISO}
              type="button"
              aria-label={`Open day ${dateISO}`} // piekļūstamība: screen reader u.c.
              aria-current={isToday ? "date" : undefined} // norāda, ka šī ir “pašreizējā” diena
              className={[base, monthTint, weekendTint, todayRing].join(" ")} // savienojam visas klases
              onClick={() => onOpenDate?.(dateISO)} // uzklikšķinot – atveram dienu (ja callback padots)
            >
              {/* ---- Dienas numurs (augšējais kreisais) ---- */}
              <div
                className={"text-base md:text-3xl font-normal leading-tight " + defaultNumClass}
                style={dayColor ? { color: dayColor } : undefined} // ja DayLog iedevis krāsu – pārkrāsojam ciparu
              >
                {day}
              </div>

              {/* ---- Ikonu josla apakšā: 💼 ✅ 🎉 (uz mob mazākas) ---- */}
              <div className="mt-auto flex items-center gap-1">
                {hasDiary && (
                  <span
                    role="img"
                    aria-label="work diary"
                    title={`${items.length} work diary item${items.length > 1 ? "s" : ""}`}
                    className="leading-none text-[13px] md:text-xl" // mob: ~13px; md+: lielākas
                  >
                    💼
                  </span>
                )}
       {hasTodos && (
  <IconCircle
    className={todoBorderClass(todoPriority)} // ⬅️ krāsa pēc prioritātes
  >
    ✅
  </IconCircle>
)}
                {hasRecurring && (
                  <span
                    role="img"
                    aria-label="recurring event"
                    title="Recurring event"
                    className="leading-none text-[13px] md:text-xl"
                  >
                    🎉
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
