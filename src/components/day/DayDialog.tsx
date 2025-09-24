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
const fetcher = (url: string) => fetch(url).then((r) => r.json());
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
  return (key: string, fallback: string) => {
    try {
      const val = t(key as any) as unknown as string;
      return val && !val.includes(".") ? val : fallback;
    } catch {
      return fallback;
    }
  };
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
          // TS: cast uz ISODate, jo template-literal tips
          date: normISO(baseLog.date as unknown as string),
        });
      } else {
        setDraft({ date }); // jau ISO no kalendāra/overview
      }
      setYearlyTitle("");
    }
  }, [open, date, baseLog]);

  const dateHeader = useMemo(() => {
    if (!date) return "";
    const d = new Date(`${date}T00:00:00Z`);
    const weekday = d.toLocaleDateString(locale, { weekday: "long" });
    const rest = d.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return `${weekday}, ${rest}`;
  }, [date, locale]);

  // Enable "Save" only if color actually changed (string|null vs base)
  const canSave = useMemo(() => {
    if (!draft) return false;
    const before = baseLog?.dayColor ?? undefined; // undefined = nav bijis
    const after = draft.dayColor; // string | null | undefined
    return after !== before;
  }, [draft, baseLog]);

  const saveDay = useCallback(async () => {
    if (!draft) return;

    // —— vieglā validācija ——
    const isISO = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
    const isHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);

    const dateISO = isISO(draft.date as unknown as string)
      ? (draft.date as ISODate)
      : normISO(draft.date as unknown as string);

    // build payload
    const payload: any = { date: dateISO };
    if (draft.dayColor !== undefined) {
      if (draft.dayColor !== null && !isHex(draft.dayColor)) {
        alert(tx("validationError", "Please fix the highlighted fields."));
        return;
      }
      payload.dayColor = draft.dayColor; // string vai null => notīrīt
    }

    const key = `/api/daylog?date=${dateISO}`;

    // optimistic cache
    try {
      mutate(key, { dayLog: { date: dateISO, dayColor: draft.dayColor }, occurrences: [] }, false);
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
  }, [draft, onOpenChange, tx]);

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
            w-full sm:w-[min(96vw,880px)]
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
                <p id="day-dialog-desc" className="text-xs sm:text-sm opacity-70">
                  {tx("dialogSubtitleLite", "Pick a color, add quick items, and save.")}
                </p>
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
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
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
                      onSelect={(v) => setDraft((d) => ({ ...(d ?? { date: (date as ISODate) }), dayColor: v }))}
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
