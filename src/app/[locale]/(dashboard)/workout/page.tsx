"use client";

import {useEffect, useMemo, useState} from "react";
// If you use next-intl, you can import it later
// import { useTranslations, useLocale } from "next-intl";

/**
 * Workout / Sport page (MVP)
 * TailwindCSS required (no external UI libs).
 * LocalStorage stubbed storage; swap to your /api/workouts when ready.
 */

// ---------- Types ----------
export type WorkoutKind =
  | "run"
  | "walk"
  | "ride"
  | "swim"
  | "strength"
  | "yoga"
  | "other";

export type StrengthSet = {
  movement: string;
  sets?: number | null;
  reps?: number | null;
  weightKg?: number | null;
};

export type WorkoutSession = {
  id: string; // uuid
  userId?: number | string;
  dateISO: string; // YYYY-MM-DD
  kind: WorkoutKind;

  durationMin: number;
  distanceKm?: number | null;       // cardio only
  perceivedEffort?: number | null;  // 1–10 RPE
  notes?: string;
  tags?: string[];

  strengthSets?: StrengthSet[];     // strength only

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  source?: "manual" | "timer" | "wearable";
};

export type QuickFormState = {
  kind: WorkoutKind;
  durationMin: number;
  distanceKm?: number | null;     // cardio only
  perceivedEffort?: number | null;
  notes?: string;
  strengthSets?: StrengthSet[];   // strength only
};

// ---------- Helpers ----------
const uid = () =>
  (typeof crypto !== "undefined" && (crypto as any).randomUUID?.()) ||
  Math.random().toString(36).slice(2);
const clamp = (n: number, a: number, b: number) => Math.min(Math.max(n, a), b);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtMins = (m: number) => `${Math.floor(m)} min`;
const fmtKm = (k?: number | null) => (k == null ? "—" : `${Number(k).toFixed(2)} km`);

function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const KIND_META: Record<
  WorkoutKind,
  { label: string; emoji: string; color: string }
> = {
  run: { label: "Running", emoji: "🏃", color: "from-rose-500 to-pink-500" },
  walk: { label: "Walking", emoji: "🚶", color: "from-emerald-500 to-teal-500" },
  ride: { label: "Cycling", emoji: "🚴", color: "from-sky-500 to-cyan-500" },
  swim: { label: "Swimming", emoji: "🏊", color: "from-blue-500 to-indigo-500" },
  strength: { label: "Strength", emoji: "🏋️", color: "from-amber-500 to-orange-500" },
  yoga: { label: "Yoga", emoji: "🧘", color: "from-fuchsia-500 to-purple-500" },
  other: { label: "Other", emoji: "✨", color: "from-zinc-500 to-neutral-500" },
};

// ---------- Local cache (fallback when API not ready) ----------
const LS_KEY = "workouts:v1";
function loadLocal(): WorkoutSession[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as WorkoutSession[]) : [];
  } catch {
    return [];
  }
}
function saveLocal(s: WorkoutSession[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

// ---------- API stubs (swap to your real endpoints) ----------
const api = {
  async listByDate(dateISO: string): Promise<WorkoutSession[]> {
    const all = loadLocal();
    return all
      .filter((w) => w.dateISO === dateISO)
      .sort((a, b) => a.createdAt - b.createdAt);
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
    const all = loadLocal();
    all.push(item);
    saveLocal(all);
    return item;
  },
  async update(
    id: string,
    patch: Partial<WorkoutSession>
  ): Promise<WorkoutSession> {
    const all = loadLocal();
    const i = all.findIndex((w) => w.id === id);
    if (i < 0) throw new Error("Not found");
    all[i] = { ...all[i], ...patch, updatedAt: Date.now() };
    saveLocal(all);
    return all[i];
  },
  async remove(id: string): Promise<void> {
    const all = loadLocal();
    saveLocal(all.filter((w) => w.id !== id));
  },
};

// ---------- Page ----------
export default function WorkoutPage() {
  const [date, setDate] = useState<string>(todayISO());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState<WorkoutSession | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);

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
    const distance = sessions.reduce(
      (a, s) => a + (s.distanceKm || 0),
      0
    );
    return { minutes, distance };
  }, [sessions]);

  const week = useMemo(() => buildWeek(date, sessionsAllLocal()), [date, sessions]);

  // ---------- Handlers ----------
  async function handleCreate(input: QuickFormState) {
    const doc = normalizeQuickForm(input, date);
    // optimistic
    setSessions((prev) => [
      ...prev,
      { ...doc, id: uid(), createdAt: Date.now(), updatedAt: Date.now() },
    ]);
    const created = await api.create(doc);
    // reconcile
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

  function startTimer() {
    setTimerStart(Date.now());
    setShowTimer(true);
  }
  async function stopTimer(kind: WorkoutKind = "run") {
    if (!timerStart) return;
    const elapsedMin = Math.max(
      1,
      Math.round((Date.now() - timerStart) / 60000)
    );
    setShowTimer(false);
    setTimerStart(null);
    await handleCreate({ kind, durationMin: elapsedMin });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Workout</h1>
          <p className="text-sm text-muted-foreground">
            Log your daily activities with the right fields per sport.
          </p>
        </div>
        <HeaderDateControls
          date={date}
          onChange={setDate}
          totals={totals}
          onStartTimer={startTimer}
        />
      </div>

      {/* Timer Banner */}
      {showTimer && timerStart && (
        <TimerBanner
          startMs={timerStart}
          onCancel={() => {
            setShowTimer(false);
            setTimerStart(null);
          }}
          onSave={(kind) => stopTimer(kind)}
        />
      )}

      {/* Main Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick form + List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Quick log"
              subtitle="Add a workout for the selected day."
            />
            <div className="p-4 pt-0">
              <QuickLogForm onSubmit={handleCreate} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Your workouts"
              subtitle={date}
              right={
                <span className="text-xs text-muted-foreground">
                  {pending
                    ? "Loading…"
                    : sessions.length
                      ? `${sessions.length} item(s)`
                      : "No workouts yet"}
                </span>
              }
            />
            <div className="divide-y">
              {sessions.length === 0 && (
                <EmptyState message="Nothing logged for this day. Try adding a quick session above." />
              )}
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

        {/* Right: Weekly snapshot, templates (stub) */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="This week" subtitle="Minutes per day" />
            <div className="p-4 pt-0">
              <WeekMiniChart data={week} highlightDate={date} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Templates" subtitle="Speed up logging" />
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

// ---------- Header Controls ----------
function HeaderDateControls({
  date,
  totals,
  onChange,
  onStartTimer,
}: {
  date: string;
  totals: { minutes: number; distance: number };
  onChange: (d: string) => void;
  onStartTimer: () => void;
}) {
  function shift(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().slice(0, 10));
  }
  return (
    <div className="flex flex-col sm:flex-row items-start gap-3">
      <div className="flex items-center gap-2">
        <button
          className="btn subtle"
          onClick={() => shift(-1)}
          aria-label="Previous day"
        >
          ‹
        </button>
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          className="btn subtle"
          onClick={() => shift(+1)}
          aria-label="Next day"
        >
          ›
        </button>
        <button className="btn ghost ml-2" onClick={() => onChange(todayISO())}>
          Today
        </button>
      </div>
      <div className="flex items-center gap-4 sm:ml-4">
        <Badge label={fmtMins(totals.minutes)} hint="Total time" />
        <Badge label={fmtKm(totals.distance)} hint="Total distance" />
        <button className="btn primary" onClick={onStartTimer}>
          Start timer
        </button>
      </div>
    </div>
  );
}

// ---------- Quick Log Form ----------
function QuickLogForm({ onSubmit }: { onSubmit: (v: QuickFormState) => void }) {
  const [kind, setKind] = useState<WorkoutKind>("run");
  const [durationMin, setDurationMin] = useState<number>(30);
  const [distanceKm, setDistanceKm] = useState<number | "">("");
  const [effort, setEffort] = useState<number | "">(6);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // Strength-only sets editor
  const [sets, setSets] = useState<StrengthSet[]>([]);

  const isCardio =
    kind === "run" || kind === "walk" || kind === "ride" || kind === "swim";
  const isStrength = kind === "strength";

  function addSet() {
    setSets((s) => [...s, { movement: "", sets: 3, reps: 10, weightKg: null }]);
  }
  function updateSet(i: number, patch: Partial<StrengthSet>) {
    setSets((arr) => arr.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeSet(i: number) {
    setSets((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setBusy(true);
    const payload: QuickFormState = {
      kind,
      durationMin: clamp(Number(durationMin) || 0, 1, 1440),
      distanceKm: isCardio
        ? distanceKm === ""
          ? null
          : Math.max(0, Number(distanceKm))
        : undefined,
      perceivedEffort: effort === "" ? null : clamp(Number(effort), 1, 10),
      notes: notes.trim() || undefined,
      strengthSets: isStrength
        ? sets.filter((s) => (s.movement || "").trim().length > 0)
        : undefined,
    };
    onSubmit(payload);
    // reset some fields
    setNotes("");
    setSets([]);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {/* Type & base fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <LabeledInput label="Type">
          <select
            className="input"
            value={kind}
            onChange={(e) => setKind(e.target.value as WorkoutKind)}
          >
            <option value="run">Running</option>
            <option value="walk">Walking</option>
            <option value="ride">Cycling</option>
            <option value="swim">Swimming</option>
            <option value="strength">Strength</option>
            <option value="yoga">Yoga</option>
            <option value="other">Other</option>
          </select>
        </LabeledInput>

        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Duration (min)">
            <input
              type="number"
              min={1}
              max={1440}
              value={durationMin}
              onChange={(e) => setDurationMin(parseInt(e.target.value || "0"))}
              className="input w-full"
            />
          </LabeledInput>

          {isCardio && (
            <LabeledInput label="Distance (km)" hint="optional">
              <input
                type="number"
                step="0.01"
                min={0}
                value={distanceKm}
                onChange={(e) =>
                  setDistanceKm(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="input w-full"
              />
            </LabeledInput>
          )}
        </div>
      </div>

      {/* Strength sets editor */}
      {isStrength && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Sets</div>
          <div className="rounded-xl border divide-y">
            {sets.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">
                No sets yet. Add your first one.
              </div>
            )}
            {sets.map((row, i) => (
              <div key={i} className="p-3 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input
                    className="input"
                    placeholder="Exercise (e.g., Squat)"
                    value={row.movement}
                    onChange={(e) => updateSet(i, { movement: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    placeholder="Sets"
                    value={row.sets ?? ""}
                    onChange={(e) =>
                      updateSet(i, {
                        sets: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    placeholder="Reps"
                    value={row.reps ?? ""}
                    onChange={(e) =>
                      updateSet(i, {
                        reps: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="input"
                    type="number"
                    step="0.5"
                    min={0}
                    placeholder="kg"
                    value={row.weightKg ?? ""}
                    onChange={(e) =>
                      updateSet(i, {
                        weightKg:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    className="icon-btn"
                    title="Remove"
                    onClick={() => removeSet(i)}
                  >
                    ✖️
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn subtle" onClick={addSet}>
            Add set
          </button>
        </div>
      )}

      {/* Common optional fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <LabeledInput label="Effort (RPE 1–10)" hint="optional">
          <input
            type="number"
            min={1}
            max={10}
            value={effort}
            onChange={(e) =>
              setEffort(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="input w-full"
          />
        </LabeledInput>
        <LabeledInput label="Notes" hint="optional">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input w-full"
            placeholder={
              isStrength ? "Chest felt strong, paused reps…" : "Felt great, easy pace…"
            }
          />
        </LabeledInput>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn primary" onClick={submit} disabled={busy}>
          Save workout
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setKind("run");
            setDurationMin(30);
            setDistanceKm("");
            setEffort(6);
            setNotes("");
            setSets([]);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ---------- Workout Row ----------
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
  const meta = KIND_META[session.kind];
  const isStrength = session.kind === "strength";
  const setsCount = isStrength ? session.strengthSets?.length || 0 : 0;

  return (
    <div className="p-4 flex items-start gap-3">
      <div
        className={classNames(
          "h-10 w-10 shrink-0 rounded-lg bg-gradient-to-r text-white grid place-items-center",
          meta.color
        )}
      >
        <span className="text-xl" aria-hidden>
          {meta.emoji}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate">
            <div className="font-semibold leading-tight truncate">{meta.label}</div>
            <div className="text-xs text-muted-foreground">
              {fmtMins(session.durationMin)}
              {session.distanceKm != null && !isStrength
                ? ` · ${fmtKm(session.distanceKm)}`
                : ""}
              {session.perceivedEffort ? ` · RPE ${session.perceivedEffort}` : ""}
              {isStrength && setsCount > 0 ? ` · ${setsCount} set(s)` : ""}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="icon-btn" title="Toggle RPE" onClick={onToggleEffort}>
              🎚️
            </button>
            <button className="icon-btn" title="Edit" onClick={onEdit}>
              ✏️
            </button>
            <button className="icon-btn" title="Delete" onClick={onDelete}>
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
                  `${s.movement || "Exercise"} ${s.sets ?? ""}x${s.reps ?? ""}${
                    s.weightKg ? `@${s.weightKg}kg` : ""
                  }`
              )
              .join(" · ")}
            {session.strengthSets!.length > 3 ? " · …" : ""}
          </div>
        )}

        {session.notes && (
          <div className="mt-1 text-sm text-foreground/80">{session.notes}</div>
        )}
      </div>
    </div>
  );
}

// ---------- Week mini chart ----------
function WeekMiniChart({
  data,
  highlightDate,
}: {
  data: { dateISO: string; minutes: number }[];
  highlightDate: string;
}) {
  const max = Math.max(30, ...data.map((d) => d.minutes));
  return (
    <div className="grid grid-cols-7 gap-2">
      {data.map((d, i) => {
        const h = Math.round((d.minutes / max) * 72); // px
        const active = d.dateISO === highlightDate;
        const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i];
        return (
          <div key={d.dateISO} className="flex flex-col items-center">
            <div
              className={classNames(
                "w-7 rounded-t-md bg-gradient-to-t from-foreground/20 to-foreground/70 transition-all",
                active && "from-primary/40 to-primary"
              )}
              style={{ height: h }}
            />
            <div
              className={classNames(
                "mt-1 text-[11px]",
                active ? "font-semibold" : "text-muted-foreground"
              )}
            >
              {dow}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Templates (stub) ----------
function TemplateList({ onUse }: { onUse: (tpl: QuickFormState) => void }) {
  const templates: { name: string; payload: QuickFormState }[] = [
    {
      name: "5K Easy Run",
      payload: { kind: "run", durationMin: 30, distanceKm: 5, perceivedEffort: 5 },
    },
    {
      name: "Push Day 45m",
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
    {
      name: "Yoga Flow 30m",
      payload: { kind: "yoga", durationMin: 30, perceivedEffort: 4 },
    },
  ];
  return (
    <div className="grid gap-2">
      {templates.map((t) => (
        <button key={t.name} className="tpl-btn" onClick={() => onUse(t.payload)}>
          <span className="truncate">{t.name}</span>
          <span className="text-xs text-muted-foreground">
            {fmtMins(t.payload.durationMin)}
            {t.payload.distanceKm ? ` · ${fmtKm(t.payload.distanceKm)}` : ""}
          </span>
        </button>
      ))}
      <div className="text-xs text-muted-foreground">
        (Connect to real templates later)
      </div>
    </div>
  );
}

// ---------- Edit Dialog (inline lightbox) ----------
function EditDialog({
  session,
  onClose,
  onSave,
}: {
  session: WorkoutSession;
  onClose: () => void;
  onSave: (patch: Partial<WorkoutSession>) => void;
}) {
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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal
    >
      <div className="w-full max-w-lg rounded-2xl bg-background shadow-xl ring-1 ring-foreground/10">
        <div className="p-4 border-b">
          <div className="text-base font-semibold">Edit workout</div>
        </div>
        <div className="p-4 space-y-4">
          <LabeledInput label="Type">
            <select
              className="input"
              value={form.kind}
              onChange={(e) => update("kind", e.target.value as WorkoutKind)}
            >
              {Object.keys(KIND_META).map((k) => (
                <option key={k} value={k}>
                  {KIND_META[k as WorkoutKind].label}
                </option>
              ))}
            </select>
          </LabeledInput>

          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="Duration (min)">
              <input
                className="input"
                type="number"
                min={1}
                max={1440}
                value={form.durationMin}
                onChange={(e) => update("durationMin", Number(e.target.value))}
              />
            </LabeledInput>
            <LabeledInput label="Distance (km)" hint="optional">
              <input
                className="input"
                type="number"
                step="0.01"
                min={0}
                value={form.distanceKm}
                onChange={(e) =>
                  update(
                    "distanceKm",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </LabeledInput>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="Effort (RPE)" hint="optional">
              <input
                className="input"
                type="number"
                min={1}
                max={10}
                value={form.perceivedEffort}
                onChange={(e) =>
                  update(
                    "perceivedEffort",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </LabeledInput>
            <LabeledInput label="Notes" hint="optional">
              <input
                className="input"
                type="text"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </LabeledInput>
          </div>
        </div>
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={() =>
              onSave({
                kind: form.kind,
                durationMin: clamp(Number(form.durationMin) || 0, 1, 1440),
                distanceKm:
                  form.distanceKm === "" ? null : Math.max(0, Number(form.distanceKm)),
                perceivedEffort:
                  form.perceivedEffort === ""
                    ? null
                    : clamp(Number(form.perceivedEffort), 1, 10),
                notes: (form.notes || "").trim() || undefined,
              })
            }
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Timer Banner ----------
function TimerBanner({
  startMs,
  onCancel,
  onSave,
}: {
  startMs: number;
  onCancel: () => void;
  onSave: (kind: WorkoutKind) => void;
}) {
  const [kind, setKind] = useState<WorkoutKind>("run");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const mins = Math.max(0, Math.floor((now - startMs) / 60000));
  const secs = Math.floor(((now - startMs) % 60000) / 1000);
  return (
    <div className="mt-4 rounded-xl border bg-gradient-to-r from-primary/10 to-transparent p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
          ⏱️
        </span>
        <div>
          <div className="text-sm font-medium">Recording…</div>
          <div className="text-xs text-muted-foreground">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")} elapsed
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="input"
          value={kind}
          onChange={(e) => setKind(e.target.value as WorkoutKind)}
        >
          {Object.keys(KIND_META).map((k) => (
            <option key={k} value={k}>
              {KIND_META[k as WorkoutKind].label}
            </option>
          ))}
        </select>
        <button className="btn subtle" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" onClick={() => onSave(kind)}>
          Stop & save
        </button>
      </div>
    </div>
  );
}

// ---------- Small primitives ----------
function Card({ children }: { children: any }) {
  return (
    <div className="rounded-2xl border bg-background/60 backdrop-blur-sm shadow-sm ring-1 ring-foreground/5 overflow-hidden">
      {children}
    </div>
  );
}
function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: any;
}) {
  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div>
        <div className="font-semibold leading-tight">{title}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}
function LabeledInput({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: any;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-muted-foreground">
        {label} {hint && <em className="not-italic opacity-70">({hint})</em>}
      </span>
      {children}
    </label>
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
  return (
    <div className="p-6 text-center text-sm text-muted-foreground">{message}</div>
  );
}

// Inputs base styles: move to global.css if you prefer
if (typeof document !== "undefined") {
  const base = document.createElement("style");
  base.innerHTML = `
  .input { @apply rounded-lg border w-full bg-background px-3 py-2 text-sm outline-none ring-0 focus:border-foreground/40 transition; }
  .btn { @apply inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition; }
  .btn.primary { @apply border-transparent bg-foreground text-background hover:opacity-90; }
  .btn.ghost { @apply border-transparent hover:bg-foreground/5; }
  .btn.subtle { @apply border bg-background hover:bg-foreground/5; }
  .icon-btn { @apply inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-foreground/10; }
  .tpl-btn { @apply flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:border-foreground/30; }
  `;
  document.head.appendChild(base);
}

// ---------- Week utilities ----------
function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function sessionsAllLocal(): WorkoutSession[] {
  return typeof window === "undefined" ? [] : loadLocal();
}
function buildWeek(dateISO: string, all: WorkoutSession[]) {
  const base = startOfWeek(new Date(dateISO));
  const days: { dateISO: string; minutes: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const minutes = all
      .filter((s) => s.dateISO === iso)
      .reduce((a, s) => a + s.durationMin, 0);
    days.push({ dateISO: iso, minutes });
  }
  return days;
}

// ---------- Normalize quick form to session ----------
function normalizeQuickForm(
  input: QuickFormState,
  dateISO: string
): Omit<WorkoutSession, "id" | "createdAt" | "updatedAt"> {
  return {
    userId: undefined,
    dateISO,
    kind: input.kind,
    durationMin: clamp(Number(input.durationMin) || 0, 1, 1440),
    distanceKm:
      input.kind !== "strength"
        ? input.distanceKm == null
          ? null
          : Math.max(0, Number(input.distanceKm))
        : null,
    perceivedEffort:
      input.perceivedEffort == null
        ? null
        : clamp(Number(input.perceivedEffort), 1, 10),
    notes: (input.notes || "").trim() || undefined,
    tags: [],
    strengthSets: input.kind === "strength" ? input.strengthSets || [] : undefined,
    source: "manual",
  };
}
