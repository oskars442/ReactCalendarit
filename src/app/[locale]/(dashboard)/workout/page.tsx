"use client";

import { useEffect, useMemo, useState } from "react";
import QuickLog from "@/features/workout/components/QuickLog";
import {
  type QuickFormState,
  type WorkoutKind,
  type WorkoutSession,
  KIND_META,
} from "@/features/workout/types";
import {
  buildWeek,
  clamp,
  fmtKm,
  fmtMins,
  loadLocal,
  saveLocal,
  startOfWeek,
  todayISO,
  uid,
} from "@/features/workout/utils";
import { useTranslations } from "@/lib/i18n/i18n";

/* ========= Local cache & API stubs ========= */

const LS_KEY = "workouts:v1";
function sessionsAllLocal(): WorkoutSession[] {
  return typeof window === "undefined" ? [] : loadLocal(LS_KEY);
}
const api = {
  async listByDate(dateISO: string): Promise<WorkoutSession[]> {
    const all = sessionsAllLocal();
    return all.filter((w) => w.dateISO === dateISO).sort((a, b) => a.createdAt - b.createdAt);
  },
  async create(
    doc: Omit<WorkoutSession, "id" | "createdAt" | "updatedAt">
  ): Promise<WorkoutSession> {
    const item: WorkoutSession = {
      ...doc,
      id: uid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const all = sessionsAllLocal();
    all.push(item);
    saveLocal(LS_KEY, all);
    return item;
  },
  async update(id: string, patch: Partial<WorkoutSession>) {
    const all = sessionsAllLocal();
    const i = all.findIndex((w) => w.id === id);
    if (i < 0) throw new Error("Not found");
    all[i] = { ...all[i], ...patch, updatedAt: Date.now() };
    saveLocal(LS_KEY, all);
    return all[i];
  },
  async remove(id: string) {
    const keep = sessionsAllLocal().filter((w) => w.id !== id);
    saveLocal(LS_KEY, keep);
  },
};

/* ================= Page =================== */

export default function WorkoutPage() {
  const t = useTranslations("workout");

  const [date, setDate] = useState<string>(todayISO());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    (async () => {
      setPending(true);
      const list = await api.listByDate(date);
      setSessions(list);
      setPending(false);
    })();
  }, [date]);

  const totals = useMemo(() => {
    const minutes = sessions.reduce((a, s) => a + (s.durationMin || 0), 0);
    const distance = sessions.reduce((a, s) => a + (s.distanceKm || 0), 0);
    return { minutes, distance };
  }, [sessions]);

  const week = useMemo(() => buildWeek(date, sessionsAllLocal()), [date, sessions]);

  async function handleCreate(input: QuickFormState) {
    const doc = normalizeQuickForm(input, date);
    setSessions((prev) => [
      ...prev,
      { ...doc, id: uid(), createdAt: Date.now(), updatedAt: Date.now() },
    ]);
    const created = await api.create(doc);
    setSessions((prev) =>
      prev.map((s) => (s.createdAt === created.createdAt ? created : s))
    );
  }

  async function handleUpdate(id: string, patch: Partial<WorkoutSession>) {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await api.update(id, patch);
  }

  async function handleDelete(id: string) {
    const keep = sessions.filter((s) => s.id !== id);
    setSessions(keep);
    await api.remove(id);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <HeaderDateControls
          date={date}
          onChange={setDate}
          totals={totals}
        />
      </div>

      {/* Main Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick form + List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t("quickLog.title")} subtitle={t("quickLog.subtitle")} />
            <div className="p-4 pt-0">
              <QuickLog onSubmit={handleCreate} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title={t("yourWorkouts")}
              subtitle={date}
              right={
                <span className="text-xs text-muted-foreground">
                  {pending
                    ? t("loading")
                    : sessions.length
                    ? t("items", { count: sessions.length })
                    : t("noWorkouts")}
                </span>
              }
            />
            <div className="divide-y">
              {sessions.length === 0 && <EmptyState message={t("emptyState")} />}
              {sessions.map((s) => (
                <WorkoutRow
                  key={s.id}
                  session={s}
                  onEdit={() => setEditing(s)}
                  onDelete={() => handleDelete(s.id)}
                  onToggleEffort={() =>
                    handleUpdate(s.id, {
                      perceivedEffort: s.perceivedEffort ? null : 6,
                    })
                  }
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Weekly snapshot, templates */}
        <div className="space-y-6">
          <Card>
            <CardHeader title={t("thisWeek")} subtitle={t("minutesPerDay")} />
            <div className="p-4 pt-0">
              <WeekMiniChart data={week} highlightDate={date} />
            </div>
          </Card>

          <Card>
            <CardHeader title={t("templates.title")} subtitle={t("templates.subtitle")} />
            <div className="p-4 pt-0">
              <TemplateList onUse={(tpl) => handleCreate(tpl)} />
            </div>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
      {editing && (
        <EditDialog
          session={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await handleUpdate(editing.id, patch);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ===== Header controls (bez timer pogas) ===== */

function HeaderDateControls({
  date,
  totals,
  onChange,
}: {
  date: string;
  totals: { minutes: number; distance: number };
  onChange: (d: string) => void;
}) {
  const t = useTranslations("workout");
  function shift(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().slice(0, 10));
  }
  return (
    <div className="flex flex-col sm:flex-row items-start gap-3">
      <div className="flex items-center gap-2">
        <button className="btn subtle" onClick={() => shift(-1)} aria-label={t("prevDay")}>
          ‹
        </button>
        <input type="date" className="input" value={date} onChange={(e) => onChange(e.target.value)} />
        <button className="btn subtle" onClick={() => shift(+1)} aria-label={t("nextDay")}>
          ›
        </button>
        <button className="btn ghost ml-2" onClick={() => onChange(todayISO())}>
          {t("today")}
        </button>
      </div>
      <div className="flex items-center gap-4 sm:ml-4">
        <Badge label={fmtMins(totals.minutes, t)} hint={t("totalTime")} />
        <Badge label={fmtKm(totals.distance, t)} hint={t("totalDistance")} />
      </div>
    </div>
  );
}

/* ===== Workout Row ===== */

function WorkoutRow({
  session,
  onEdit,
  onDelete,
  onToggleEffort,
}: {
  session: WorkoutSession;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEffort: () => void;
}) {
  const t = useTranslations("workout");
  const meta = KIND_META(t)[session.kind];
  const isStrength = session.kind === "strength";
  const setsCount = isStrength ? session.strengthSets?.length || 0 : 0;

  return (
    <div className="p-4 flex items-start gap-3">
      <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r text-white grid place-items-center ${meta.color}`}>
        <span className="text-xl" aria-hidden>
          {meta.emoji}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate">
            <div className="font-semibold leading-tight truncate">{meta.label}</div>
            <div className="text-xs text-muted-foreground">
              {fmtMins(session.durationMin, t)}
              {session.distanceKm != null && !isStrength ? ` · ${fmtKm(session.distanceKm, t)}` : ""}
              {session.perceivedEffort ? ` · ${t("rpeShort")} ${session.perceivedEffort}` : ""}
              {isStrength && setsCount > 0 ? ` · ${setsCount} ${t("setsShortSuffix")}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="icon-btn" title={t("actions.toggleRpe")} onClick={onToggleEffort}>
              🎚️
            </button>
            <button className="icon-btn" title={t("actions.edit")} onClick={onEdit}>
              ✏️
            </button>
            <button className="icon-btn" title={t("actions.delete")} onClick={onDelete}>
              🗑️
            </button>
          </div>
        </div>

        {isStrength && setsCount > 0 && (
          <div className="mt-1 text-xs text-muted-foreground truncate">
            {session.strengthSets!
              .slice(0, 3)
              .map(
                (s) =>
                  `${s.movement || t("placeholders.exercise")} ${s.sets ?? ""}x${s.reps ?? ""}${s.weightKg ? `@${s.weightKg}${t("kg")}` : ""}`
              )
              .join(" · ")}
            {session.strengthSets!.length > 3 ? " · …" : ""}
          </div>
        )}

        {session.notes && <div className="mt-1 text-sm text-foreground/80">{session.notes}</div>}
      </div>
    </div>
  );
}

/* ===== Week mini chart ===== */

function WeekMiniChart({
  data,
  highlightDate,
}: {
  data: { dateISO: string; minutes: number }[];
  highlightDate: string;
}) {
  const t = useTranslations("workout");
  const max = Math.max(30, ...data.map((d) => d.minutes));
  const days = [
    t("weekdays.mon"),
    t("weekdays.tue"),
    t("weekdays.wed"),
    t("weekdays.thu"),
    t("weekdays.fri"),
    t("weekdays.sat"),
    t("weekdays.sun"),
  ];
  return (
    <div className="grid grid-cols-7 gap-2">
      {data.map((d, i) => {
        const h = Math.round((d.minutes / max) * 72);
        const active = d.dateISO === highlightDate;
        return (
          <div key={d.dateISO} className="flex flex-col items-center">
            <div
              className={`w-7 rounded-t-md bg-gradient-to-t from-foreground/20 to-foreground/70 transition-all ${
                active ? "from-primary/40 to-primary" : ""
              }`}
              style={{ height: h }}
            />
            <div className={`mt-1 text-[11px] ${active ? "font-semibold" : "text-muted-foreground"}`}>
              {days[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===== Templates (stub) ===== */

function TemplateList({ onUse }: { onUse: (tpl: QuickFormState) => void }) {
  const t = useTranslations("workout");
  const templates: { name: string; payload: QuickFormState }[] = [
    {
      name: t("tpl.easy5k"),
      payload: { kind: "run", durationMin: 30, distanceKm: 5, perceivedEffort: 5 },
    },
    {
      name: t("tpl.push45"),
      payload: {
        kind: "strength",
        durationMin: 45,
        perceivedEffort: 7,
        strengthSets: [
          { movement: "Bench Press", sets: 4, reps: 8, weightKg: 40 },
          { movement: "Incline DB Press", sets: 3, reps: 10, weightKg: 20 },
        ],
      },
    },
    { name: t("tpl.yoga30"), payload: { kind: "yoga", durationMin: 30, perceivedEffort: 4 } },
  ];
  return (
    <div className="grid gap-2">
      {templates.map((tpl) => (
        <button key={tpl.name} className="tpl-btn" onClick={() => onUse(tpl.payload)}>
          <span className="truncate">{tpl.name}</span>
          <span className="text-xs text-muted-foreground">
            {fmtMins(tpl.payload.durationMin, t)}
            {tpl.payload.distanceKm ? ` · ${fmtKm(tpl.payload.distanceKm, t)}` : ""}
          </span>
        </button>
      ))}
      <div className="text-xs text-muted-foreground">{t("templates.hintLater")}</div>
    </div>
  );
}

/* ===== Edit Dialog ===== */

function EditDialog({
  session,
  onClose,
  onSave,
}: {
  session: WorkoutSession;
  onClose: () => void;
  onSave: (patch: Partial<WorkoutSession>) => void;
}) {
  const t = useTranslations("workout");
  const [form, setForm] = useState({
    kind: session.kind,
    durationMin: session.durationMin,
    distanceKm: session.distanceKm ?? "",
    perceivedEffort: session.perceivedEffort ?? "",
    notes: session.notes ?? "",
  } as any);

  function update<K extends string>(key: K, val: any) {
    setForm((f: any) => ({ ...f, [key]: val }));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-lg rounded-2xl bg-background shadow-xl ring-1 ring-foreground/10">
        <div className="p-4 border-b">
          <div className="text-base font-semibold">{t("editWorkout")}</div>
        </div>
        <div className="p-4 space-y-4">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">{t("fields.type")}</span>
            <select className="input" value={form.kind} onChange={(e) => update("kind", e.target.value as WorkoutKind)}>
              {Object.keys(KIND_META(t)).map((k) => (
                <option key={k} value={k}>
                  {KIND_META(t)[k as WorkoutKind].label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t("fields.duration")}</span>
              <input
                className="input"
                type="number"
                min={1}
                max={1440}
                value={form.durationMin}
                onChange={(e) => update("durationMin", Number(e.target.value))}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("fields.distance")} <em className="not-italic opacity-70">({t("optional")})</em>
              </span>
              <input
                className="input"
                type="number"
                step="0.01"
                min={0}
                value={form.distanceKm}
                onChange={(e) => update("distanceKm", e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t("fields.rpeShort")}</span>
              <input
                className="input"
                type="number"
                min={1}
                max={10}
                value={form.perceivedEffort}
                onChange={(e) => update("perceivedEffort", e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t("fields.notes")}</span>
              <input className="input" type="text" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </label>
          </div>
        </div>
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button className="btn ghost" onClick={onClose}>
            {t("actions.cancel")}
          </button>
          <button
            className="btn primary"
            onClick={() =>
              onSave({
                kind: form.kind,
                durationMin: clamp(Number(form.durationMin) || 0, 1, 1440),
                distanceKm: form.distanceKm === "" ? null : Math.max(0, Number(form.distanceKm)),
                perceivedEffort:
                  form.perceivedEffort === "" ? null : clamp(Number(form.perceivedEffort), 1, 10),
                notes: (form.notes || "").trim() || undefined,
              })
            }
          >
            {t("actions.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Small primitives ===== */

function Card({ children }: { children: any }) {
  return (
    <div className="rounded-2xl border bg-background/60 backdrop-blur-sm shadow-sm ring-1 ring-foreground/5 overflow-hidden">
      {children}
    </div>
  );
}
function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: any }) {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div>
        <div className="font-semibold leading-tight">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}
function Badge({ label, hint }: { label: string; hint?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs bg-background/70">
      <span className="font-medium">{label}</span>
      {hint && <span className="text-muted-foreground">{hint}</span>}
    </span>
  );
}
function EmptyState({ message }: { message: string }) {
  return <div className="p-6 text-center text-sm text-muted-foreground">{message}</div>;
}

/* ===== Helpers that depend on i18n ===== */

function normalizeQuickForm(
  input: QuickFormState,
  dateISO: string
): Omit<WorkoutSession, "id" | "createdAt" | "updatedAt"> {
  return {
    userId: undefined,
    dateISO,
    kind: input.kind,
    durationMin: clamp(Number(input.durationMin) || 0, 1, 1440),
    distanceKm: input.kind !== "strength" ? (input.distanceKm == null ? null : Math.max(0, Number(input.distanceKm))) : null,
    perceivedEffort: input.perceivedEffort == null ? null : clamp(Number(input.perceivedEffort), 1, 10),
    notes: (input.notes || "").trim() || undefined,
    tags: [],
    strengthSets: input.kind === "strength" ? input.strengthSets || [] : undefined,
    source: "manual",
  };
}
