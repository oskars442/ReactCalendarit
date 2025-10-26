// src/components/CalendarMonth.tsx
"use client";

import * as React from "react";

// ✅ Dati
import holidays2025 from "@/features/data/holidays-2025.json";
import { WORK_STATS_2025 } from "@/features/data/work-stats-2025";

// ====== Tipi ======
type DayItem = { id: string; title: string };

type Day = {
  dateISO: string; // "YYYY-MM-DD"
  day: number;
  inMonth: boolean;
  items: DayItem[];
  dayColor?: string;
  hasTodos?: boolean;
  todoPriority?: "low" | "med" | "high";
};

type HolidayType = "holiday" | "preHoliday" | "movedDay";
type Holiday = {
  date: string; // "YYYY-MM-DD"
  title: string;
  type: HolidayType;
  shortHours?: number; // piem., 7
  description?: string;
};

// ====== Svētku meklētājs ======
const HOLIDAY_MAP = new Map<string, Holiday>(
  (holidays2025 as Holiday[]).map((h) => [h.date, h])
);
function getHoliday(iso: string): Holiday | undefined {
  return HOLIDAY_MAP.get(iso);
}

// ====== UI palīgi ======
function todoBorderClass(p?: "low" | "med" | "high") {
  switch (p) {
    case "high":
      return "border-rose-500";
    case "med":
      return "border-amber-500";
    case "low":
      return "border-emerald-500";
    default:
      return "border-emerald-500";
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

// Fona tonis pēc svētku veida
function holidayTintClass(h?: Holiday, inMonth?: boolean) {
  if (!h || !inMonth) return "";
  switch (h.type) {
    case "holiday":
      return "bg-red-100 dark:bg-red-900/30";
    case "preHoliday":
      return "bg-amber-100 dark:bg-amber-900/20";
    case "movedDay":
      return "bg-sky-100 dark:bg-sky-900/20";
    default:
      return "";
  }
}

// Tikai šodienai zils teksts; citādi – standarta
function dayNumberClass(isToday: boolean) {
  return isToday ? "text-sky-700 dark:text-sky-300" : "text-gray-900 dark:text-gray-100";
}

// Īsa etiķete stūrī (BRĪVS / 7h / PĀRCELTA)
function holidayBadge(h: Holiday) {
  switch (h.type) {
    case "holiday":
      return { text: "BRĪVS", klass: "bg-red-600 text-white" };
    case "preHoliday":
      return {
        text: h.shortHours ? `${h.shortHours}h` : "Saīsināta",
        klass: "bg-amber-500 text-black",
      };
    case "movedDay":
      return { text: "PĀRCELTA", klass: "bg-sky-600 text-white" };
    default:
      return null;
  }
}

// Tooltip saturs
function holidayTitle(h: Holiday | undefined) {
  if (!h) return undefined;
  const extra =
    (h.shortHours ? ` — ${h.shortHours} darba st.` : "") +
    (h.description ? ` — ${h.description}` : "");
  return `${h.title}${extra}`;
}

// ====== Mēneša info (kopsavilkumam) ======
function currentMonthYear(days: { dateISO: string; inMonth: boolean }[]) {
  const firstInMonth = days.find((d) => d.inMonth);
  if (!firstInMonth) return null;
  const dt = new Date(firstInMonth.dateISO);
  return { month: dt.getMonth() + 1, year: dt.getFullYear() };
}

function monthLabel(days: { dateISO: string; inMonth: boolean }[], locale = "lv-LV") {
  const info = currentMonthYear(days);
  if (!info) return "";
  const dt = new Date(days.find((d) => d.inMonth)!.dateISO);
  return dt.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

// ===================== Galvenais komponents =====================
export default function CalendarMonth({
  days,
  weekdayLabels,
  onOpenDate,
  recurringDates,
}: {
  days: Day[];
  weekdayLabels: string[];
  onOpenDate?: (iso: string) => void;
  recurringDates?: Set<string>;
}) {
  const todayISO = new Date().toISOString().slice(0, 10);

  // Oficiālais kopsavilkums (no PDF datiem)
  const info = React.useMemo(() => currentMonthYear(days), [days]);
  const label = React.useMemo(() => monthLabel(days), [days]);
  const official = info && info.year === 2025 ? WORK_STATS_2025[info.month] : undefined;

  return (
    <div className="w-full">
      {/* ---------- Nedēļas dienu galviņa ---------- */}
      <div className="mb-1 md:mb-2 grid grid-cols-7 gap-0 md:gap-2">
        {weekdayLabels.map((lbl, i) => {
          const isWeekendCol = i === 5 || i === 6;
          return (
            <div
              key={lbl + i}
              className={
                "rounded-none md:rounded-md py-1 md:py-2 text-center text-[11px] md:text-sm font-semibold " +
                (isWeekendCol
                  ? "bg-rose-50/60 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                  : "bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:text-gray-300")
              }
              title={lbl}
            >
              {lbl}
            </div>
          );
        })}
      </div>

      {/* ---------- 6x7 dienu režģis ---------- */}
      <div className="grid grid-cols-7 gap-0 md:gap-2">
        {days.map(({ dateISO, day, inMonth, items, dayColor, hasTodos, todoPriority }, idx) => {
          const col = idx % 7;
          const isWeekendCol = col === 5 || col === 6;
          const isToday = dateISO === todayISO;

          // Svētku statuss
          const holiday = getHoliday(dateISO);

          const base = [
            "relative",
            "aspect-square md:aspect-auto",
            "min-h-0 md:min-h-28",
            "rounded-none md:rounded-xl",
            "border",
            "p-0.5 md:p-3",
            "transition-all text-left",
            "flex flex-col",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
          ].join(" ");

          // Robežas (separāti no fona)
          const borderTint = inMonth
            ? "border-gray-200 dark:border-gray-800"
            : "border-gray-200/60 dark:border-gray-800/60 opacity-80";

          // ✅ Fons — tikai viena `bg-*` klase
          let bgClass = "";
          if (holiday && inMonth) {
            bgClass = holidayTintClass(holiday, true);
          } else if (!inMonth) {
            bgClass = "bg-gray-50 dark:bg-gray-800/40";
          } else if (isWeekendCol) {
            bgClass = "bg-rose-50/40 dark:bg-rose-900/10";
          } else {
            bgClass = "bg-white dark:bg-gray-900";
          }

          const todayRing = isToday ? "ring-2 ring-sky-400 dark:ring-sky-500 shadow-sm" : "";
          const defaultNumClass = dayNumberClass(isToday);
          const badge = holiday ? holidayBadge(holiday) : null;

          const hasDiary = (items?.length ?? 0) > 0;
          const hasRecurring = recurringDates?.has(dateISO) ?? false;

          return (
            <button
              key={dateISO}
              type="button"
              aria-label={`Open day ${dateISO}`}
              aria-current={isToday ? "date" : undefined}
              className={[base, borderTint, bgClass, todayRing].join(" ")}
              title={holidayTitle(holiday)}
              onClick={() => onOpenDate?.(dateISO)}
            >
              {/* Dienas numurs */}
              <div
                className={"text-base md:text-3xl font-normal leading-tight " + defaultNumClass}
                style={dayColor ? { color: dayColor } : undefined}
              >
                {day}
              </div>

              {/* Etiķete stūrī */}
              {badge && (
                <span
                  className={
                    "absolute right-1 top-1 rounded px-1.5 py-0.5 text-[10px] md:text-xs font-medium " +
                    badge.klass
                  }
                >
                  {badge.text}
                </span>
              )}

              {/* Ikonu josla apakšā */}
              <div className="mt-auto flex items-center gap-1">
                {hasDiary && (
                  <span
                    role="img"
                    aria-label="work diary"
                    title={`${items.length} work diary item${items.length > 1 ? "s" : ""}`}
                    className="leading-none text-[13px] md:text-xl"
                  >
                    💼
                  </span>
                )}
                {hasTodos && (
                  <IconCircle className={todoBorderClass(todoPriority)}>✅</IconCircle>
                )}
                {hasRecurring && (
                  <span
                    role="img"
                    aria-label="recurring event"
                    className="leading-none text-[13px] md:text-xl"
                    title="Recurring event"
                  >
                    🎉
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ---------- Oficiālais kopsavilkums no PDF ---------- */}
      <div className="mt-3 md:mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 px-3 py-2 text-sm flex items-center justify-between">
        <div className="opacity-80">
          📊 <span className="capitalize">{label}</span>
        </div>

        {official ? (
          <div className="font-medium">
            Oficiāli noteiktās: {official.days} darba dienas · {official.hours} Darba stundas
          </div>
        ) : (
          <div className="font-medium">(Nav oficiālu datu šim gadam)</div>
        )}
      </div>
      {/* Ja gribi paskaidrojumu rindu, atkomentē: */}
      {/*
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Balstīts uz 5 d./40 h nedēļu. Pirmssvētku dienās – 7 h; pārceltās darba dienas iekļautas.
      </p>
      */}
    </div>
  );
}
