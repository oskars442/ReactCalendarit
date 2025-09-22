// src/components/CalendarMonth.tsx
"use client";

type DayItem = { id: string; title: string };

type Day = {
  dateISO: string;
  day: number;
  inMonth: boolean;
  items: DayItem[];      // work-diary items (we render a briefcase only)
  dayColor?: string;
  hasTodos?: boolean;    // optional notebook icon
};

export default function CalendarMonth({
  days,
  weekdayLabels,
  onOpenDate,
  recurringDates, // ISO dates that have a recurring (yearly/monthly) event
}: {
  days: Day[];
  weekdayLabels: string[];
  onOpenDate?: (iso: string) => void;
  recurringDates?: Set<string>;
}) {
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="w-full">
      {/* Weekday header */}
      <div className="mb-2 grid grid-cols-7 gap-2">
        {weekdayLabels.map((lbl, i) => {
          const isWeekendCol = i === 5 || i === 6;
          return (
            <div
              key={lbl + i}
              className={
                "rounded-md py-2 text-center text-[13px] font-semibold md:text-sm " +
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

      {/* 6x7 grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map(({ dateISO, day, inMonth, items, dayColor, hasTodos }, idx) => {
          const col = idx % 7;
          const isWeekendCol = col === 5 || col === 6;
          const isToday = dateISO === todayISO;

          const base =
            "relative min-h-24 md:min-h-28 rounded-xl border p-2 md:p-3 transition-all text-left";
          const monthTint = inMonth
            ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            : "bg-gray-50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-800/60 opacity-80";
          const weekendTint =
            isWeekendCol && inMonth ? "bg-rose-50/40 dark:bg-rose-900/10" : "";
          const todayRing = isToday ? "ring-2 ring-sky-400 dark:ring-sky-500 shadow-sm" : "";

          const defaultNumClass =
            isToday ? "text-sky-700 dark:text-sky-300" : "text-gray-900 dark:text-gray-100";

          const hasDiary = (items?.length ?? 0) > 0;
          const hasRecurring = recurringDates?.has(dateISO) ?? false;

          return (
            <button
              key={dateISO}
              type="button"
              aria-label={`Open day ${dateISO}`}
              aria-current={isToday ? "date" : undefined}
              className={[
                base,
                monthTint,
                weekendTint,
                todayRing,
                "flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              ].join(" ")}
              onClick={() => onOpenDate?.(dateISO)}
            >
              {/* Day number (top-left) */}
              <div
                className={"text-2xl md:text-3xl font-normal leading-tight " + defaultNumClass}
                style={dayColor ? { color: dayColor } : undefined}
              >
                {day}
              </div>

              {/* Icons row pinned to the bottom */}
              <div className="mt-auto flex items-center gap-1">
                {hasDiary && (
                  <span
                    role="img"
                    aria-label="work diary"
                    title={`${items.length} work diary item${items.length > 1 ? "s" : ""}`}
                    className="text-xl leading-none"
                  >
                    💼
                  </span>
                )}
                {hasTodos && (
                  <span
                    role="img"
                    aria-label="todos"
                    title="To-dos due"
                    className="text-xl leading-none"
                  >
                    ✅
                  </span>
                )}
                {hasRecurring && (
                  <span
                    role="img"
                    aria-label="recurring event"
                    title="Recurring event"
                    className="text-xl leading-none"
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
