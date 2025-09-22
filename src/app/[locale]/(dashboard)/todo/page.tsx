// src/app/[locale]/(dashboard)/todo/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";

/* ---------- Types (UI) ---------- */
type Priority = "low" | "med" | "high";
type Task = {
  id: string;
  title: string;
  note?: string;
  done: boolean;
  priority: Priority;
  due?: string;           // YYYY-MM-DD (date-only string in LOCAL time)
  createdAt: number;
  updatedAt: number;
};

/* ---------- Helpers ---------- */
const todayISO = () => new Date().toISOString().slice(0, 10);
const classNames = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const LS_KEY = "todo:v1";
const saveLS = (tasks: Task[]) => localStorage.setItem(LS_KEY, JSON.stringify(tasks));
const loadLS = (): Task[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
};

const isToday = (iso?: string) => !!iso && iso === todayISO();
const isUpcoming = (iso?: string) => !!iso && iso > todayISO();

/** tiny fetch helper (no-store to avoid stale caches) */
async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

/** Normalize various server 'due' shapes to LOCAL date-only YYYY-MM-DD */
function normalizeDateOnly(input: unknown): string | undefined {
  if (!input) return undefined;

  // Already a date-only string?
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  // ISO string / number / Date → adjust for TZ offset, then slice date part
  const d = new Date(input as any);
  if (isNaN(d.getTime())) return undefined;

  // remove local timezone offset so the ISO date part matches the intended local calendar date
  const fixed = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return fixed.toISOString().slice(0, 10);
}

/** map server item → UI Task (due is ALWAYS YYYY-MM-DD) */
function toTask(i: any): Task {
  return {
    id: String(i.id),
    title: i.title,
    note: i.note ?? undefined,
    done: !!i.done,
    priority: (i.priority ?? "med") as Priority,
    due: normalizeDateOnly(i.due),
    createdAt: new Date(i.createdAt).getTime(),
    updatedAt: new Date(i.updatedAt ?? i.createdAt).getTime(),
  };
}

/* ---------- Page ---------- */
export default function TodoPage() {
  const t = useTranslations("todo");
  const locale = useLocale();

  // data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // search / filters
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "done">("all");
  const [showCompleted, setShowCompleted] = useState(true);

  // quick add
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [due, setDue] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // edit modal
  const [editing, setEditing] = useState<Task | null>(null);

  // refetch helper (mount + DayDialog quick-actions event)
  const refetch = useCallback(async () => {
    try {
      const data = await api<{ items: any[] }>("/api/todo");
      setTasks(data.items.map(toTask));
    } catch {
      setTasks(loadLS());
    }
  }, []);

  /* Load from API (fallback to LS) */
  useEffect(() => {
    (async () => {
      try {
        await refetch();
      } finally {
        setLoading(false);
      }
    })();
  }, [refetch]);

  /* Listen for Quick Actions from DayDialog */
  useEffect(() => {
    const onChanged = () => {
      void refetch();
    };
    window.addEventListener("calendarit:todosChanged", onChanged);
    return () => window.removeEventListener("calendarit:todosChanged", onChanged);
  }, [refetch]);

  /* Persist LS backup on change (non-blocking) */
  useEffect(() => {
    if (!loading) saveLS(tasks);
  }, [tasks, loading]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey)
        inputRef.current?.focus();
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        (document.getElementById("todo-search") as HTMLInputElement)?.focus();
      }
      if (e.key === "a" && !e.metaKey && !e.ctrlKey) setShowCompleted((s) => !s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Safer display: add noon to dodge DST edges
  const formatDue = (iso?: string) =>
    iso
      ? new Date(iso + "T12:00:00").toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
        })
      : "";

  /* Derived list */
  const filtered = useMemo(() => {
    let arr = tasks;
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.note || "").toLowerCase().includes(q),
      );
    }
    if (filter === "today") arr = arr.filter((t) => isToday(t.due));
    if (filter === "upcoming") arr = arr.filter((t) => isUpcoming(t.due));
    if (filter === "done") arr = arr.filter((t) => t.done);
    if (!showCompleted && filter !== "done") arr = arr.filter((t) => !t.done);

    // sort: not done first; then due asc; then newest updated
    arr = [...arr].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if ((a.due || "") !== (b.due || "")) return (a.due || "").localeCompare(b.due || "");
      return b.updatedAt - a.updatedAt;
    });
    return arr;
  }, [tasks, query, filter, showCompleted]);

  const completedCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  /* ---------- Actions (optimistic) ---------- */
  async function addTask() {
    const val = title.trim();
    if (!val) return;

    const temp: Task = {
      id: `tmp_${Date.now()}`,
      title: val,
      note: note.trim() || undefined,
      done: false,
      priority,
      due,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTasks((prev) => [temp, ...prev]);

    setTitle("");
    setNote("");
    setPriority("med");
    setDue(undefined);
    inputRef.current?.focus();

    try {
      const res = await api<{ item: any }>("/api/todo", {
        method: "POST",
        body: JSON.stringify({
          title: temp.title,
          note: temp.note,
          priority: temp.priority,
          due: temp.due ?? null, // send null if unset
        }),
      });
      const created = toTask(res.item);
      setTasks((prev) => [created, ...prev.filter((t) => t.id !== temp.id)]);
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== temp.id)); // rollback
    }
  }

  async function toggleDone(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, updatedAt: Date.now() } : t,
      ),
    );

    const now = tasks.find((t) => t.id === id);
    const nextDone = now ? !now.done : true;

    try {
      await api(`/api/todo/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ done: nextDone }),
      });
    } catch {
      // revert on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, done: !t.done, updatedAt: Date.now() } : t,
        ),
      );
    }
  }

  async function removeTask(id: string) {
    const backup = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api(`/api/todo/${id}`, { method: "DELETE" });
    } catch {
      setTasks(backup);
    }
  }

  async function updateTask(patch: Task) {
    const backup = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === patch.id ? { ...patch, updatedAt: Date.now() } : t)),
    );
    try {
      await api(`/api/todo/${patch.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: patch.title,
          note: patch.note ?? null,
          priority: patch.priority,
          due: patch.due ?? null,
        }),
      });
    } catch {
      setTasks(backup);
    }
  }

  async function clearCompleted() {
    const doneIds = tasks.filter((t) => t.done).map((t) => t.id);
    if (doneIds.length === 0) return;
    const backup = tasks;
    setTasks((prev) => prev.filter((t) => !t.done));
    try {
      await Promise.all(doneIds.map((id) => api(`/api/todo/${id}`, { method: "DELETE" })));
    } catch {
      setTasks(backup);
    }
  }

  /* ---------- UI helpers ---------- */
  function priorityTheme(p: Priority) {
    switch (p) {
      case "high":
        return "bg-rose-500/15 text-rose-500 ring-rose-500/25";
      case "med":
        return "bg-amber-500/15 text-amber-500 ring-amber-500/25";
      default:
        return "bg-emerald-500/15 text-emerald-500 ring-emerald-500/25";
    }
  }

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-xl rounded-xl bg-white p-6 text-center text-gray-600 shadow dark:bg-gray-900 dark:text-gray-300">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header / Progress */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground opacity-80">{t("subtitle")}</p>
        </div>
        <div className="min-w-[180px]">
          <div className="mb-1 flex items-center justify-between text-xs opacity-80">
            <span>{t("progress", { done: completedCount, total: tasks.length })}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Quick Add */}
      <section className="mb-6 rounded-2xl border border-neutral-200/60 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-900/50 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium opacity-80">{t("addTask.label")}</label>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) addTask();
              }}
              placeholder={t("addTask.placeholder")}
              className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
            />
            <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              {t("addTask.tip")}
            </div>
          </div>

          <div className="w-full md:w-44">
            <label className="text-xs font-medium opacity-80">{t("priority.label")}</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(["low", "med", "high"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={classNames(
                    "rounded-lg border px-2.5 py-2 text-sm capitalize transition",
                    priority === p
                      ? "border-transparent ring-2 ring-cyan-400/40 " + priorityTheme(p)
                      : "border-neutral-200/70 hover:bg-neutral-50/50 dark:border-neutral-800 dark:hover:bg-neutral-800/40",
                  )}
                >
                  {t(`priority.${p}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full md:w-44">
            <label className="text-xs font-medium opacity-80">{t("due.label")}</label>
            <input
              type="date"
              value={due || ""}
              onChange={(e) => setDue(e.target.value || undefined)}
              className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
            />
          </div>

          <div className="w-full md:w-72">
            <label className="text-xs font-medium opacity-80">{t("notes.label")}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) addTask();
              }}
              rows={1}
              placeholder={t("notes.placeholder")}
              className="mt-1 w-full resize-y rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
            />
          </div>

          <button
            onClick={addTask}
            className="h-[42px] rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 font-medium text-white transition hover:brightness-110 active:scale-[.99] md:h-[46px]"
            aria-label={t("addTask.buttonAria")}
          >
            {t("addTask.button")}
          </button>
        </div>
      </section>

      {/* Toolbar */}
      <section className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          {(["all", "today", "upcoming", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={classNames(
                "rounded-full border px-3.5 py-1.5 text-sm transition",
                filter === f
                  ? "border-transparent bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 hover:bg-neutral-100/60 dark:border-neutral-800 dark:hover:bg-neutral-800/40",
              )}
            >
              {t(`filters.${f}`)}
            </button>
          ))}
          <div className="ml-1 flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 dark:border-neutral-800">
            <input
              id="toggle-completed"
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            <label htmlFor="toggle-completed" className="text-sm">
              {t("showCompleted")}
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              id="todo-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-64 rounded-xl border border-neutral-200/60 bg-white/70 pl-10 pr-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
            />
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              🔎
            </div>
          </div>
          <button
            onClick={clearCompleted}
            className="rounded-xl border border-neutral-200 px-3.5 py-2 text-sm hover:bg-neutral-100/60 dark:border-neutral-800 dark:hover:bg-neutral-800/40"
            title={t("clearDone.title")}
          >
            {t("clearDone.button")}
          </button>
        </div>
      </section>

      {/* Task list */}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {filtered.map((ti) => (
          <li
            key={ti.id}
            className={classNames(
              "group relative rounded-2xl border border-neutral-200/60 bg-white/70 p-4 backdrop-blur transition hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/60",
              ti.done && "opacity-70",
            )}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={ti.done}
                onChange={() => toggleDone(ti.id)}
                className="mt-1 h-5 w-5 accent-emerald-500"
                aria-label={t("aria.toggleComplete")}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={classNames(
                      "break-words font-semibold leading-6",
                      ti.done && "line-through",
                    )}
                  >
                    {ti.title}
                  </h3>
                  <span
                    className={classNames(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                      priorityTheme(ti.priority),
                    )}
                  >
                    {t(`priority.${ti.priority}`)}
                  </span>
                  {ti.due && (
                    <span
                      className={classNames(
                        "ml-auto rounded-full px-2 py-0.5 text-xs ring-1",
                        isToday(ti.due)
                          ? "bg-sky-500/10 text-sky-600 ring-sky-400/30 dark:text-sky-300"
                          : isUpcoming(ti.due)
                          ? "bg-violet-500/10 text-violet-600 ring-violet-400/30 dark:text-violet-300"
                          : "bg-neutral-500/10 text-neutral-600 ring-neutral-300/40 dark:text-neutral-300",
                      )}
                      title={ti.due}
                    >
                      {t("due.badge", { date: formatDue(ti.due) })}
                    </span>
                  )}
                </div>

                {ti.note && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">
                    {ti.note}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setEditing(ti)}
                    className="rounded-lg border border-neutral-200 px-2.5 py-1 text-sm hover:bg-neutral-100/60 dark:border-neutral-800 dark:hover:bg-neutral-800/40"
                  >
                    {t("actions.edit")}
                  </button>
                  <button
                    onClick={() => removeTask(ti.id)}
                    className="rounded-lg border border-neutral-200 px-2.5 py-1 text-sm hover:bg-rose-500/10 dark:border-neutral-800"
                  >
                    {t("actions.delete")}
                  </button>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-white/10 to-transparent" />
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="mt-10 text-center text-neutral-500">{t("empty")}</div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          task={editing}
          onClose={() => setEditing(null)}
          onSave={(tsk) => {
            updateTask(tsk);
            setEditing(null);
          }}
        />
      )}

      {/* Shortcuts helper */}
      <div className="mt-10 rounded-xl border border-neutral-200/60 p-4 text-sm text-neutral-600 dark:border-neutral-800/80 dark:text-neutral-300">
        <div className="mb-2 font-medium">{t("shortcuts.title")}</div>
        <div className="flex flex-wrap gap-4">
          <kbd className="rounded-md border px-2 py-1">n</kbd> {t("shortcuts.focusAdd")}
          <kbd className="rounded-md border px-2 py-1">/</kbd> {t("shortcuts.search")}
          <kbd className="rounded-md border px-2 py-1">a</kbd> {t("shortcuts.toggleCompleted")}
          <kbd className="rounded-md border px-2 py-1">Enter</kbd> {t("shortcuts.addTask")}
          <kbd className="rounded-md border px-2 py-1">Shift+Enter</kbd> {t("shortcuts.addFromNotes")}
        </div>
      </div>
    </div>
  );
}

/* ---------- Edit Modal ---------- */
function EditModal({
  task,
  onClose,
  onSave,
}: {
  task: Task;
  onClose: () => void;
  onSave: (t: Task) => void;
}) {
  const t = useTranslations("todo.editModal");
  const tCommon = useTranslations("todo");
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note || "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [due, setDue] = useState<string | undefined>(task.due);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-2.5 py-1 hover:bg-neutral-100/60 dark:border-neutral-800 dark:hover:bg-neutral-800/40"
          >
            {t("close")}
          </button>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="text-xs font-medium opacity-80">{t("fields.title")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
            />
          </div>

          <div>
            <label className="text-xs font-medium opacity-80">{t("fields.notes")}</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium opacity-80">{t("fields.priority")}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
              >
                <option value="low">{tCommon("priority.low")}</option>
                <option value="med">{tCommon("priority.med")}</option>
                <option value="high">{tCommon("priority.high")}</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-medium opacity-80">{tCommon("due.label")}</label>
              <input
                type="date"
                value={due || ""}
                onChange={(e) => setDue(e.target.value || undefined)}
                className="mt-1 w-full rounded-xl border border-neutral-200/60 bg-white/70 px-3.5 py-2.5 outline-none ring-cyan-400/40 focus:ring-2 dark:border-neutral-800/80 dark:bg-neutral-900"
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-neutral-200 px-3.5 py-2 hover:bg-neutral-100/60 dark:border-neutral-800 dark:hover:bg-neutral-800/40"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() =>
                onSave({
                  ...task,
                  title: title.trim() || task.title,
                  note: note.trim() || undefined,
                  priority,
                  due,
                })
              }
              className="rounded-xl bg-neutral-900 px-4 py-2 font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              {t("save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
