"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import useSWR, { mutate } from "swr";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ISODate, DayLog, RecurringEvent, HexColor } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

// services
import WorkDiaryModal from "@/components/WorkDiaryModal";
import { addForDate as addGrocery } from "@/services/groceries";
import { create as addTodo } from "@/services/todos";
import { createRecurringYearly } from "@/services/recurring";

import { getHolidaysForYear } from "@/features/data/holidays";

type HolidayType = "holiday" | "preHoliday" | "movedDay";
type Holiday = {
  date: string;
  title: string;
  type: HolidayType;
  shortHours?: number;
  description?: string;
};

/** Iedod svētkus konkrētam ISO datumam (ņemot vērā gadu) */
function getHoliday(iso: string): Holiday | undefined {
  const year = Number(iso.slice(0, 4));
  const list = getHolidaysForYear(year) as Holiday[];
  return list.find(h => h.date === iso);
}

function holidayBadge(h: Holiday) {
  switch (h.type) {
    case "holiday":    return { text: "BRĪVS",     cls: "bg-red-600 text-white" };
    case "preHoliday": return { text: `${h.shortHours ?? 7}h`, cls: "bg-amber-500 text-black" };
    case "movedDay":   return { text: "PĀRCELTA",  cls: "bg-sky-600 text-white" };
    default:           return null;
  }
}

/* ------------------------- tiny fetch helper ------------------------- */
const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* -------------------------- small UI helper -------------------------- */
function ColorSwatch({
  value,
  selected,
  onSelect,
}: {
  value: HexColor;
  selected: boolean;
  onSelect: (v: HexColor) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-label={`Pick ${value}`}
      className={`h-7 w-7 rounded-full ring-2 transition ${
        selected ? "ring-black/60" : "ring-black/10 hover:ring-black/30"
      }`}
      style={{ backgroundColor: value }}
      title={value}
    />
  );
}

/* ------------------------------ data hook --------------------------- */
function useDay(date: ISODate | null) {
  const key = date ? `/api/daylog?date=${date}` : null;
  return useSWR<{ dayLog: DayLog | null; occurrences: RecurringEvent[] }>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  );
}

/* ----------------------------- i18n helper -------------------------- */
function useTx() {
  const t = useTranslations("day");
  return (key: string, fallback: string) => t(key as any, { fallback });
}

/* =========================== Saved (left) =========================== */
/** Vienkāršs kreisās kolonnas panelis ar dienas saglabātajiem ierakstiem */
function SavedForDay({
  dateISO,
  occurrences,
}: {
  dateISO: ISODate;
  occurrences: RecurringEvent[];
}) {
  const tx = useTx();

  // --- API endpoints (adjust if needed)
  const todosUrl = `/api/todo?due=${dateISO}`;
  const from = `${dateISO} 00:00:00`;
const to   = `${dateISO} 23:59:59`;
const workUrl = `/api/work?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  // --- SWR dataseti (ja nav endpointu, droši izmet ārā konkrēto bloku)
  const { data: tData, isLoading: tLoading } = useSWR<any>(todosUrl, fetcher);
  const { data: wData, isLoading: wLoading } = useSWR<any>(workUrl, fetcher);

 const todosRaw = Array.isArray(tData) ? tData : (tData?.items ?? []);
const todos = (todosRaw as any[]).map((x) => ({
  id: x.id ?? x._id,
  title: x.title ?? x.text ?? "",           // <- nosaukums no title vai text
  done: x.done ?? x.completed ?? false,     // <- atbalsta dažādus nosaukumus
  priority: x.priority ?? x.prio ?? null,
}));
  const works: Array<{ id?: number | string; title?: string; project?: string; hours?: number }> =
    Array.isArray(wData) ? wData : wData?.items ?? [];
    const holiday = getHoliday(dateISO);
const badge = holiday ? holidayBadge(holiday) : null;

  return (
    <div className="space-y-6">
      {/* State from LV calendar (holiday / preHoliday / movedDay) */}
{holiday && (
  <section className="overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4">
    <div className="mb-2 flex items-center gap-2">
      <span className="text-lg">📅</span>
      <div className="text-sm font-semibold">Valsts kalendārs</div>
      {badge && (
        <span className={`ml-auto rounded px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
          {badge.text}
        </span>
      )}
    </div>

    <div className="text-sm">
      <div className="font-medium">{holiday.title}</div>
      {holiday.description && (
        <div className="text-xs opacity-70 mt-0.5">{holiday.description}</div>
      )}
      {holiday.type === "preHoliday" && (
        <div className="text-xs opacity-70 mt-0.5">
          Saīsināta darba diena — {holiday.shortHours ?? 7} h
        </div>
      )}
      {holiday.type === "movedDay" && (
        <div className="text-xs opacity-70 mt-0.5">
          Pārceltā darba diena (parasti sestdiena norādīta kā darba diena).
        </div>
      )}
    </div>
  </section>
)}
      {/* Recurring occurrences (from useDay) */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4">
        <div className="text-sm font-semibold mb-2">🎉 {tx("occurrences", "Recurring today")}</div>
        {occurrences?.length ? (
          <ul className="space-y-1 text-sm">
            {occurrences.map((o, idx) => (
              <li key={o?.id ?? idx} className="flex items-start gap-2">
                <span>•</span>
                <div className="min-w-0">
                  <div className="truncate">{(o as any)?.title ?? tx("noTitle", "Untitled")}</div>
                  {(o as any)?.note && (
                    <div className="text-xs opacity-70 truncate">{(o as any).note}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm opacity-70">{tx("noOccurrences", "Nothing for today.")}</p>
        )}
      </section>


      {/* To-Dos due this day */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4">
        <div className="text-sm font-semibold mb-2">✅ {tx("todo", "To-Do")}</div>
        {tLoading ? (
          <p className="text-sm opacity-70">{tx("loading", "Loading…")}</p>
        ) : todos?.length ? (
          <ul className="space-y-1 text-sm">
            {todos.map((t, i) => (
              <li key={(t.id ?? i).toString()} className="flex items-center gap-2">
                <span className="text-xs opacity-60">•</span>
                <span className={t.done ? "line-through opacity-60" : ""}>{t.title}</span>
                {t.priority && (
                  <span className="ml-auto rounded border px-2 py-0.5 text-[10px] uppercase opacity-70">
                    {t.priority}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm opacity-70">{tx("emptyTodos", "No tasks due today.")}</p>
        )}
      </section>

      {/* Work diary entries for date */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4">
        <div className="text-sm font-semibold mb-2">💼 {tx("workDiary", "Work Diary")}</div>
        {wLoading ? (
          <p className="text-sm opacity-70">{tx("loading", "Loading…")}</p>
        ) : works?.length ? (
          <ul className="space-y-1 text-sm">
            {works.map((w, i) => (
              <li key={(w.id ?? i).toString()} className="flex items-center gap-2">
                <span className="text-xs opacity-60">•</span>
                <div className="min-w-0">
                  <div className="truncate">{w.title ?? w.project ?? tx("noTitle", "Untitled")}</div>
                </div>
                {typeof w.hours === "number" && (
                  <span className="ml-auto text-xs opacity-70">{w.hours.toFixed(2)} h</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm opacity-70">{tx("emptyWork", "No entries yet.")}</p>
        )}
      </section>
    </div>
  );
}

/* =============================== Dialog ============================= */
export default function DayDialog({
  date,
  open,
  onOpenChange,
}: {
  date: ISODate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const tx = useTx();
  const locale = useLocale();
  const { data } = useDay(date);

  const baseLog: DayLog | null = data?.dayLog ?? null;

  const [draft, setDraft] = useState<DayLog | null>(null);
  const [yearlyTitle, setYearlyTitle] = useState("");

  // helper: "2025-09-24T..." -> "2025-09-24"
  const normISO = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) ? (s as ISODate) : (s.slice(0, 10) as ISODate);

  // seed draft when dialog opens (preserve existing dayColor if present)
  useEffect(() => {
    if (open && date) {
      if (baseLog) {
        setDraft({
          ...baseLog,
          date: normISO(baseLog.date as unknown as string),
        });
      } else {
        setDraft({ date }); // ISO no kalendāra
      }
      setYearlyTitle("");
    }
  }, [open, date, baseLog]);

const dateHeader = useMemo(() => {
  if (!date) return "";
  const fmtWeek = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "Europe/Riga" });
  const fmtRest = new Intl.DateTimeFormat(locale, {
    year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Riga"
  });

  // Izveido “virtuālu” datumu tikai formatēšanai ar TZ
  const parts = date.split("-").map(Number); // [YYYY, MM, DD]
  const d = new Date(parts[0], parts[1]-1, parts[2], 12, 0, 0); // pusdienlaiks, lai izvairītos no robežstundām

  return `${fmtWeek.format(d)}, ${fmtRest.format(d)}`;
}, [date, locale]);

  // Enable "Save" only if color actually changed
  const canSave = useMemo(() => {
    if (!draft) return false;
    const before = baseLog?.dayColor ?? undefined;
    const after = draft.dayColor;
    return after !== before;
  }, [draft, baseLog]);

  const saveDay = useCallback(async () => {
    if (!draft) return;

    const isISO = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
    const isHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);

    const dateISO = isISO(draft.date as unknown as string)
      ? (draft.date as ISODate)
      : normISO(draft.date as unknown as string);

    const payload: any = { date: dateISO };
    if (draft.dayColor !== undefined) {
      if (draft.dayColor !== null && !isHex(draft.dayColor)) {
        alert(tx("validationError", "Please fix the highlighted fields."));
        return;
      }
      payload.dayColor = draft.dayColor;
    }

    const key = `/api/daylog?date=${dateISO}`;
    try {
      mutate(key, { dayLog: { date: dateISO, dayColor: draft.dayColor }, occurrences: data?.occurrences ?? [] }, false);
    } catch {}

    const res = await fetch("/api/daylog", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert(tx("saveError", "Failed to save. Try again."));
      try { mutate(key); } catch {}
      return;
    }

    let savedColor: string | null = null;
    try {
      const json = await res.json();
      savedColor = json?.dayLog?.dayColor ?? null;
    } catch {
      savedColor = draft.dayColor ?? null;
    }

    try { mutate(key); } catch {}

    window.dispatchEvent(
      new CustomEvent("calendarit:daylogSaved", {
        detail: { date: dateISO, dayColor: savedColor },
      })
    );

    onOpenChange(false);
  }, [draft, onOpenChange, tx, data?.occurrences]);

  const addYearly = useCallback(async () => {
    if (!date) return;
    if (!yearlyTitle.trim()) return;

    try {
      await createRecurringYearly(yearlyTitle.trim(), date);
      setYearlyTitle("");
      window.dispatchEvent(new Event("calendarit:recurringChanged"));
      mutate(`/api/daylog?date=${date}`);
    } catch (e) {
      alert(tx("recurringError", "Failed to save recurring event."));
    }
  }, [date, yearlyTitle, tx]);

  const dl = draft ?? undefined;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/45" />

        {/* Content */}
        <Dialog.Content
          aria-describedby="day-dialog-desc"
          className="
            fixed inset-x-0 bottom-0
            sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
            w-full sm:w-[min(96vw,980px)]
            h-[88vh] sm:h-auto sm:max-h-[85vh]
            rounded-t-3xl sm:rounded-2xl
            bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100
            shadow-2xl outline-none
            flex flex-col
          "
        >
          {/* HEADER */}
          <div className="sticky top-0 z-10 border-b border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/90 backdrop-blur px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Dialog.Title className="truncate text-base sm:text-lg font-semibold">
                  {dateHeader}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  aria-label={tx("close", "Close")}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  ✕
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
  {/* Mobilajā → kolonnas virknējas viena zem otras (kreisā vispirms),
      LG+ → pārslēdzamies uz 2-kolonu grid */}
  <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">

    {/* LEFT: Saved for this day (mobilajā pirmais) */}
    <div className="order-1 lg:order-1">
      {date && (
        <SavedForDay
          dateISO={date}
          occurrences={data?.occurrences ?? []}
        />
      )}
    </div>

    {/* RIGHT: create / edit blocks (mobilajā otrais) */}
    <div className="order-2 lg:order-2 space-y-6">
      {/* Day color */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4">
        <div className="text-sm font-semibold mb-2">🎨 {tx("dayColor", "Day color")}</div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              "#0ea5e9", // sky-500
              "#10b981", // emerald-500
              "#f59e0b", // amber-500
              "#ef4444", // red-500
              "#8b5cf6", // violet-500
              "#14b8a6", // teal-500
              "#64748b", // slate-500
              "#111827", // neutral-900
            ] as HexColor[]
          ).map((c) => (
            <ColorSwatch
              key={c}
              value={c}
              selected={dl?.dayColor === c}
              onSelect={(v) =>
                setDraft((d) => ({ ...(d ?? { date: (date as ISODate) }), dayColor: v }))
              }
            />
          ))}

          {/* custom color */}
          <label className="ml-2 inline-flex items-center gap-2 text-sm">
            <input
              type="color"
              value={(dl?.dayColor ?? "#0ea5e9") as HexColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const v = e.currentTarget.value as HexColor;
                setDraft((d) => ({ ...(d ?? { date: (date as ISODate) }), dayColor: v }));
              }}
              className="h-7 w-10 cursor-pointer rounded border border-black/10"
            />
            <span className="text-xs opacity-70">{tx("custom", "Custom")}</span>
          </label>

          {/* clear */}
          {dl?.dayColor !== undefined && (
            <button
              type="button"
              className="ml-auto rounded-md border px-2 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900"
              onClick={() =>
                setDraft((d) => ({ ...(d ?? { date: (date as ISODate) }), dayColor: null }))
              }
            >
              {tx("clear", "Clear")}
            </button>
          )}
        </div>
      </section>

      {/* Actions */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4">
        {date && (
          <QuickActions
            dateISO={date}
            onAnyAdd={() => mutate(`/api/daylog?date=${date}`)}
          />
        )}
      </section>

      {/* Yearly events */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/70 shadow-sm p-4">
        <div className="text-sm font-semibold mb-2">🎉 {tx("yearlyEvents", "Yearly Events")}</div>
        <div className="flex items-center gap-2">
          <input
            aria-label="yearly-title"
            className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
            placeholder={tx("eventPlaceholder", "Event title…")}
            value={yearlyTitle}
            onChange={(e) => setYearlyTitle(e.target.value)}
          />
          <button
            aria-label={tx("saveYearly", "Save yearly event")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-violet-600 text-white hover:bg-violet-700"
            onClick={addYearly}
            title={tx("saveYearly", "Save yearly event")}
          >
            💾 <span className="hidden sm:inline">{tx("save", "Save")}</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</div>


          {/* FOOTER */}
          <div className="border-t border-neutral-200/70 dark:border-neutral-800/70 bg-white/90 dark:bg-neutral-950/90 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <Dialog.Close asChild>
                <button
                  aria-label={tx("close", "Close")}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  {tx("close", "Close")}
                </button>
              </Dialog.Close>
              <button
                aria-label={tx("saveDayLog", "Save Day Log")}
                className={
                  "rounded-xl px-4 py-2 font-medium text-white " +
                  (canSave ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-600/60 cursor-not-allowed")
                }
                onClick={saveDay}
                disabled={!canSave}
              >
                {tx("saveDayLog", "Save Day Log")}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ======================= QuickActions helper ======================= */
function QuickActions({
  dateISO,
  onAnyAdd,
}: {
  dateISO: ISODate;
  onAnyAdd: () => void;
}) {
  const tx = useTx();

  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 1800);
  };

  // 1) Groceries
  const [gName, setGName] = useState("");
  const [gLoading, setGLoading] = useState(false);

  // 2) To-Do
  const [todoTitle, setTodoTitle] = useState("");
  const [todoPriority, setTodoPriority] = useState<"low" | "med" | "high">("med");
  const [dueISO, setDueISO] = useState<ISODate>(dateISO);
  const [tdLoading, setTdLoading] = useState(false);

  // 3) Work Diary
  const [wdISO, setWdISO] = useState<ISODate>(dateISO);
  const [wdOpen, setWdOpen] = useState(false);

  return (
    <div className="relative space-y-6">
      {/* Groceries */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🛒</span>
          <h3 className="text-sm font-semibold">{tx("groceries", "Groceries")}</h3>
        </div>
        <div className="flex w-full items-center gap-2 rounded-xl border bg-white p-2">
          <input
            value={gName}
            onChange={(e) => setGName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGrocery()}
            placeholder={tx("productPlaceholder", "Add a product…")}
            className="flex-1 rounded-lg border border-black/10 px-3 py-2 outline-none"
          />
          <button
            onClick={handleAddGrocery}
            disabled={!gName.trim() || gLoading}
            className="rounded-lg px-4 py-2 text-white"
            style={{ background: "linear-gradient(135deg,#6a5cff,#3d7bff)" }}
          >
            {gLoading ? "…" : tx("add", "Add")}
          </button>
        </div>
      </section>

      {/* To-Do */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">✅</span>
          <h3 className="text-sm font-semibold">{tx("todo", "To-Do")}</h3>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border bg-white p-2">
          <input
            value={todoTitle}
            onChange={(e) => setTodoTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
            placeholder={tx("todoPlaceholder", "Type and press Enter…")}
            className="min-w-[200px] flex-1 rounded-lg border border-black/10 px-3 py-2 outline-none"
          />
          <div className="flex items-center gap-1">
            {(["low", "med", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTodoPriority(p)}
                className={`rounded-lg border px-3 py-1 ${todoPriority === p ? "ring-2 ring-sky-400" : ""}`}
              >
                {p === "low" ? tx("low", "Low") : p === "med" ? tx("med", "Med") : tx("high", "High")}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={dueISO}
            onChange={(e) => setDueISO(e.target.value as ISODate)}
            className="rounded-lg border border-black/10 px-3 py-2 outline-none"
          />
          <button
            onClick={handleAddTodo}
            disabled={!todoTitle.trim() || tdLoading}
            className="rounded-lg px-4 py-2 text-white"
            style={{ background: "linear-gradient(135deg,#12c2e9,#0ea5e9)" }}
          >
            {tdLoading ? "…" : tx("add", "Add")}
          </button>
        </div>
      </section>

      {/* Work Diary */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">💼</span>
          <h3 className="text-sm font-semibold">{tx("workDiary", "Work Diary")}</h3>
        </div>
        <div className="flex w-full items-center gap-2 rounded-xl border bg-white p-2">
          <input
            type="date"
            value={wdISO}
            onChange={(e) => setWdISO(e.target.value as ISODate)}
            className="rounded-lg border border-black/10 px-3 py-2 outline-none"
          />
          <button
            onClick={() => setWdOpen(true)}
            className="ml-auto rounded-lg bg-neutral-900 px-4 py-2 text-white"
          >
            + {tx("new", "New")}
          </button>

          <WorkDiaryModal
            open={wdOpen}
            onClose={() => setWdOpen(false)}
            initial={{ dateISO: wdISO }}
            onSaved={() => {
              setWdOpen(false);
              onAnyAdd();
              window.dispatchEvent(
                new CustomEvent("calendarit:workDiaryChanged", { detail: { date: wdISO } })
              );
              showToast("ok", tx("toastWorkSaved", "Work Diary saved"));
            }}
          />
        </div>
      </section>

      {/* toast */}
      {toast && (
        <div
          className="
            pointer-events-none fixed
            left-[max(env(safe-area-inset-left),1.25rem)]
            bottom-[max(env(safe-area-inset-bottom),1.25rem)]
            z-[100]
          "
        >
          <div
            role="status"
            aria-live="polite"
            className={[
              "rounded-lg px-3 py-2 text-sm shadow-lg",
              "animate-in fade-in zoom-in duration-200",
              toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white",
            ].join(" ")}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );

  async function handleAddGrocery() {
    if (!gName.trim()) return;
    setGLoading(true);
    try {
      await addGrocery(dateISO, { title: gName.trim() } as any);
      setGName("");
      onAnyAdd();
      window.dispatchEvent(new Event("calendarit:groceriesChanged"));
      showToast("ok", tx("toastGroceriesOk", "Saved to Groceries"));
    } catch {
      showToast("err", tx("toastGenericErr", "Failed to save"));
    } finally {
      setGLoading(false);
    }
  }

  async function handleAddTodo() {
    if (!todoTitle.trim()) return;
    setTdLoading(true);
    try {
      await addTodo({
        title: todoTitle.trim(),
        priority: todoPriority,
        due: dueISO,
      } as any);
      setTodoTitle("");
      setDueISO(dateISO);
      setTodoPriority("med");
      onAnyAdd();
      window.dispatchEvent(
        new CustomEvent("calendarit:todosChanged", { detail: { date: dueISO } })
      );
      showToast("ok", tx("toastTodosOk", "Saved to To-Dos"));
    } catch {
      showToast("err", tx("toastGenericErr", "Failed to save"));
    } finally {
      setTdLoading(false);
    }
  }
}
