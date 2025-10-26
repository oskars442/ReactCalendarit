"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations, useLocale } from "next-intl"

/* ✅ Recharts importi — statistikai */
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

/* ====================== LV time helpers ====================== */
const LV_TZ = "Europe/Riga"

/** YYYY-MM-DDTHH:mm priekš <input type="datetime-local"> (Rīgas laikā) */
function nowForInput(tz: string = LV_TZ, locale = "lv-LV") {
  const pad = (n: string | number) => String(n).padStart(2, "0")
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value
      return acc
    }, {})
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

/** Tikai datums YYYY-MM-DD Rīgas laikā */
function todayDateInTZ(tz: string = LV_TZ) {
  return nowForInput(tz).slice(0, 10)
}

/** “HH:mm” Rīgas laikā no ISO/Date-string */
function formatTimeTZ(iso: string, tz: string = LV_TZ, locale = "lv-LV") {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso))
  } catch {
    return "—"
  }
}

/** “DD.MM.YYYY HH:mm” (locale) Rīgas laikā no ISO/Date-string */
function formatDateTimeTZ(iso: string, tz: string = LV_TZ, locale = "lv-LV") {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/* ====================== Types ====================== */
type BabyLog = {
  id: string
  userId: string
  babyId?: string | null
  occurredAt: string // ISO
  foodType: string
  amount: number
  unit: "ml" | "g" | string
  weightKg?: number | null
  notes?: string | null
}

type Baby = { id: string; name: string; birth?: string | null }

/* ====================== Page ====================== */
export default function BabyTrackerClient({ initialLogs }: { initialLogs: BabyLog[] }) {
  const t = useTranslations("babyTracker")
  const locale = useLocale()

  // State
  const [logs, setLogs] = useState<BabyLog[]>(initialLogs)
  const [range, setRange] = useState<"7d" | "30d" | "1y">("7d")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<BabyLog | null>(null)

  // Babies (demo; vēlāk aizstāt ar DB)
  const [babyOpen, setBabyOpen] = useState(false)
  const [babies, setBabies] = useState<Baby[]>([])
  const [selectedBaby, setSelectedBaby] = useState<string>("")

  // Anti-paralēlais reload slēdzis
  const isReloading = useRef(false)

  // Šodien (Rīgas laikā)
  const todayISO = todayDateInTZ()

  // Stats (šodiena Rīgas laikā)
  const stats = useMemo(() => {
    const todayLogs = logs.filter((l) => safeDatePart(l.occurredAt) === todayISO)
    const totalFeeds = todayLogs.length
    const totalAmount = todayLogs.reduce((s, l) => s + (Number(l.amount) || 0), 0)
    const last = todayLogs.at(0)?.occurredAt || "—" // serveris sūta desc
    return { totalFeeds, totalAmount, last }
  }, [logs, todayISO])

  const visibleLogs = useMemo(
    () => (selectedBaby ? logs.filter((l) => l.babyId === selectedBaby) : logs),
    [logs, selectedBaby]
  )

  // Reload by range (ar guard)
  async function reload(newRange: "7d" | "30d" | "1y" = range) {
    if (isReloading.current) return
    isReloading.current = true
    try {
      setRange(newRange)
      const days = newRange === "7d" ? 7 : newRange === "30d" ? 30 : 365
      const res = await fetch(`/api/baby-logs?days=${days}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load logs")
      const data = await res.json()
      setLogs(data.logs)
    } catch (e) {
      console.error(e)
    } finally {
      isReloading.current = false
    }
  }

  // Create (ar idempotencyKey)
  async function createLog(payload: LogPayload) {
    try {
      const body = {
        ...payload,
        babyId: selectedBaby || null,
        idempotencyKey: (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      }
      const res = await fetch("/api/baby-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to create log")
      await reload(range)
    } catch (e) {
      console.error(e)
    }
  }

  // Update
  async function updateLog(id: string, payload: LogPayload) {
    try {
      const body = { ...payload, babyId: selectedBaby || null }
      const res = await fetch(`/api/baby-logs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to update log")
      await reload(range)
    } catch (e) {
      console.error(e)
    }
  }

  // Delete
  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return
    try {
      const res = await fetch(`/api/baby-logs/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      await reload(range)
    } catch (e) {
      console.error(e)
    }
  }

  // Open edit
  function handleEdit(log: BabyLog) {
    setEditingLog(log)
    setModalOpen(true)
  }

  async function loadBabies() {
    try {
      const res = await fetch("/api/babies", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load babies")
      const data: { babies: Baby[] } = await res.json()
      setBabies(data.babies || [])

      const list = data.babies || []
      if (selectedBaby && list.some((b) => b.id === selectedBaby)) {
        // paturi esošo izvēli
        return
      }
      if (list.length === 1) {
        setSelectedBaby(list[0].id) // auto-select ja tieši 1
      } else {
        setSelectedBaby("") // liekam izvēlēties
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    void loadBabies()
  }, [])

  useEffect(() => {
    // ja ir tieši 1 bērns un šobrīd nav izvēles → auto-izvēlamies
    if (babies.length === 1 && !selectedBaby) {
      setSelectedBaby(babies[0].id)
    }
  }, [babies, selectedBaby])

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-rose-50 to-white text-neutral-900 dark:from-neutral-950 dark:to-neutral-950 dark:text-neutral-100">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-20 border-b border-neutral-200/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:supports-[backdrop-filter]:bg-neutral-900/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {/* 1. rinda: ikona + virsraksts */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10" aria-hidden>
              <span className="text-lg text-rose-500">🍼</span>
            </div>
            <h1 className="truncate text-lg font-semibold leading-tight">{t("appTitle")}</h1>
          </div>

          {/* 2. rinda: select + pogas */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="babySelect">
              {t("selectBabyLabel")}
            </label>
            <select
              id="babySelect"
              value={selectedBaby}
              onChange={(e) => setSelectedBaby(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white/70 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900/70 sm:w-56"
            >
              <option value="" disabled>
                👶 {t("selectBabyPlaceholder")}
              </option>
              {babies.map((b) => (
                <option key={b.id} value={b.id}>
                  👶 {b.name}
                </option>
              ))}
            </select>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setBabyOpen(true)}
                className="w-full rounded-xl border border-neutral-200 bg-white/70 px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900/70 sm:w-auto"
              >
                {t("addBabyBtn")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingLog(null)
                  setModalOpen(true)
                }}
                className="w-full rounded-xl bg-rose-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow sm:w-auto"
              >
                {t("newEntryBtn")}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        {/* Summary (3 cards) */}
        <section className="grid grid-cols-2 gap-4 lg:col-span-12 md:grid-cols-3">
          <StatCard label={t("statFeedsToday")} value={stats.totalFeeds} hint={t("statFeedsHint")} />
          <StatCard label={t("statAmountToday")} value={stats.totalAmount} hint={t("statAmountHint")} />
          <StatCard
            label={t("statLastFeed")}
            value={stats.last === "—" ? t("noDash") : formatTimeTZ(stats.last, LV_TZ, locale)}
          />
        </section>

        {/* Timeline + Table */}
        <section className="grid grid-cols-1 gap-6 lg:col-span-12 xl:grid-cols-5">
          <div className="rounded-2xl border border-neutral-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-900/60 xl:col-span-2">
            <h2 className="mb-3 font-semibold">{t("timelineToday")}</h2>
            <Timeline
              logs={logs.filter((l) => safeDatePart(l.occurredAt) === todayISO).slice(0, 8)}
              emptyText={t("noEntriesToday")}
              locale={locale}
            />
          </div>

          <div className="rounded-2xl border border-neutral-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-900/60 xl:col-span-3">
            <h2 className="mb-3 font-semibold">{t("history")}</h2>
            <LogsTable
              logs={visibleLogs}
              onEdit={handleEdit}
              onDelete={handleDelete}
              t={t}
              locale={locale}
            />
          </div>
        </section>

        {/* ===== Statistika ===== */}
        <section className="grid gap-4 lg:col-span-12">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("statistics")}</h2>
            <div className="inline-flex overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
              {(["7d", "30d", "1y"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => reload(r)}
                  className={`px-3 py-1.5 text-sm ${range === r ? "bg-rose-500 text-white" : "bg-white/70 dark:bg-neutral-900/60"}`}
                  aria-pressed={range === r}
                >
                  {r === "7d" ? t("range7d") : r === "30d" ? t("range30d") : t("range1y")}
                </button>
              ))}
            </div>
          </div>

          <ChartCard title={t("chartAmountTitle")} subtitle={t("chartAmountSub")} variant="bar" logs={logs} range={range} />
          <ChartCard title={t("chartWeightTitle")} subtitle={t("chartWeightSub")} variant="line" logs={logs} range={range} />
        </section>
      </main>

      {/* ===== Modals ===== */}
      {babyOpen && (
        <Modal onClose={() => setBabyOpen(false)} title={t("modalAddBaby")}>
          <AddBabyForm
            t={t}
            onAdd={(baby) => {
              setBabies((p) => [...p, baby])
              setSelectedBaby(baby.id)
              setBabyOpen(false)
            }}
          />
        </Modal>
      )}

      {modalOpen && (
        <Modal
          onClose={() => {
            setModalOpen(false)
            setEditingLog(null)
          }}
          title={editingLog ? t("modalEditEntry") : t("modalAddEntry")}
          subtitle={t("modalEntrySubtitle")}
        >
          <QuickAdd
            t={t}
            initial={
              editingLog
                ? {
                    occurredAt: editingLog.occurredAt,
                    foodType: editingLog.foodType,
                    amount: editingLog.amount,
                    unit: (editingLog.unit as "ml" | "g") ?? "ml",
                    weightKg: editingLog.weightKg ?? null,
                    notes: editingLog.notes ?? "",
                  }
                : undefined
            }
            onAdd={async (p) => {
              if (editingLog) {
                await updateLog(editingLog.id, p)
              } else {
                await createLog(p)
              }
              setModalOpen(false)
              setEditingLog(null)
            }}
            onCancel={() => {
              setModalOpen(false)
              setEditingLog(null)
            }}
            mode={editingLog ? "edit" : "create"}
            locale={locale}
          />
        </Modal>
      )}
    </div>
  )
}

/* ====================== Subcomponents ====================== */
function Timeline({
  logs,
  emptyText,
  locale,
}: {
  logs: BabyLog[]
  emptyText: string
  locale: string
}) {
  if (!logs?.length) return <div className="text-sm text-neutral-500">{emptyText}</div>

  return (
    <ol className="relative ml-3 border-s border-neutral-200 dark:border-neutral-800">
      {logs.slice(0, 8).map((l) => (
        <li key={l.id} className="ms-6 py-3">
          <span className="absolute -start-1.5 mt-2 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-neutral-500">{formatTimeTZ(l.occurredAt, LV_TZ, locale)}</div>
            <div className="text-xs rounded-full bg-rose-500/10 px-2 py-0.5 text-rose-600">{l.foodType}</div>
          </div>
          <div className="mt-1 text-sm">
            <span className="font-medium">
              {l.amount} {l.unit}
            </span>
            {l.weightKg != null ? <span className="text-neutral-500"> · {l.weightKg} kg</span> : null}
          </div>
          {l.notes && (
            <div className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap break-words">{l.notes}</div>
          )}
        </li>
      ))}
    </ol>
  )
}

function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-900/60">
      <div className="mb-1 text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold leading-none">{value}</div>
      {hint ? <div className="mt-1 text-xs text-neutral-400">{hint}</div> : null}
    </div>
  )
}

function AddBabyForm({ onAdd, t }: { onAdd: (b: Baby) => void; t: ReturnType<typeof useTranslations> }) {
  const [name, setName] = useState("")
  const [birth, setBirth] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    const res = await fetch("/api/babies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: n,
        birth: birth || undefined,
      }),
    })
    if (!res.ok) {
      console.error("Failed to create baby")
      return
    }
    const data: { baby: Baby } = await res.json()
    onAdd(data.baby)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">{t("babyName")}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder={t("placeholderBabyName")}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">{t("babyBirth")}</label>
        <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className="input" />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setName("")
            setBirth("")
          }}
          className="rounded-xl bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800"
        >
          {t("clear")}
        </button>
        <button type="submit" className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white">
          {t("saveBaby")}
        </button>
      </div>
    </form>
  )
}

function Modal({
  onClose,
  title,
  subtitle,
  children,
}: {
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-xl dark:border-neutral-800/80 dark:bg-neutral-900"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{title}</h3>
            {subtitle ? <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-neutral-100 px-2 py-1 text-sm dark:bg-neutral-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ====== Create/Edit form in modal (ar lock + spineri) ====== */
type LogPayload = {
  occurredAt: string
  foodType: string
  amount: number
  unit: "ml" | "g" | string
  weightKg: number | null
  notes: string
}

function QuickAdd({
  onAdd,
  onCancel,
  initial,
  mode = "create",
  t,
  locale,
}: {
  onAdd: (row: LogPayload) => Promise<void> | void
  onCancel?: () => void
  initial?: Partial<LogPayload>
  mode?: "create" | "edit"
  t: ReturnType<typeof useTranslations>
  locale: string
}) {
  const [dt, setDt] = useState(() => {
    if (initial?.occurredAt) {
      const d = new Date(initial.occurredAt)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      const hh = String(d.getHours()).padStart(2, "0")
      const mi = String(d.getMinutes()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
    }
    return nowForInput()
  })
  const [food, setFood] = useState(initial?.foodType ?? t("foodBreastMilk"))
  const [amount, setAmount] = useState<string>(initial?.amount != null ? String(initial.amount) : "")
  const [unit, setUnit] = useState<"ml" | "g">((initial?.unit as "ml" | "g") ?? "ml")
  const [weightKg, setWeightKg] = useState<string>(initial?.weightKg != null ? String(initial.weightKg) : "")
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!initial) return
    if (initial.occurredAt) {
      const d = new Date(initial.occurredAt)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      const hh = String(d.getHours()).padStart(2, "0")
      const mi = String(d.getMinutes()).padStart(2, "0")
      setDt(`${yyyy}-${mm}-${dd}T${hh}:${mi}`)
    }
    if (initial.foodType) setFood(initial.foodType)
    if (initial.amount != null) setAmount(String(initial.amount))
    if (initial.unit) setUnit(initial.unit as "ml" | "g")
    if (initial.weightKg != null) setWeightKg(String(initial.weightKg))
    if (initial.notes != null) setNotes(initial.notes)
  }, [initial])

  const canSubmit = amount !== "" && !isSubmitting

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!canSubmit) return
        try {
          setIsSubmitting(true)
          await onAdd({
            occurredAt: new Date(dt).toISOString(),
            foodType: food,
            amount: Number(amount || 0),
            unit,
            weightKg: weightKg === "" ? null : Number(weightKg),
            notes,
          })
        } finally {
          setIsSubmitting(false)
        }
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">{t("formDateTime")}</label>
        <input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} className="input" />
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">{t("formFoodType")}</label>
        <select value={food} onChange={(e) => setFood(e.target.value)} className="input">
          <option>{t("foodMix")}</option>
          <option>{t("foodBreastMilk")}</option>
          <option>{t("foodPorridge")}</option>
          <option>{t("foodVeggies")}</option>
          <option>{t("foodFruits")}</option>
          <option>{t("foodWater")}</option>
          <option>{t("foodOther")}</option>
        </select>
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">{t("formAmount")}</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step="1"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input flex-1"
          />
          <select value={unit} onChange={(e) => setUnit(e.target.value as "ml" | "g")} className="input w-24">
            <option>ml</option>
            <option>g</option>
          </select>
        </div>
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">{t("formWeightKgOpt")}</label>
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="kg"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          className="input"
        />
      </div>
      <div className="grid gap-1 sm:col-span-2">
        <label className="text-xs text-neutral-500">{t("formNotes")}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("notesPlaceholder")}
          className="input min-h-[70px]"
        />
      </div>
      <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800"
            disabled={isSubmitting}
          >
            {t("cancel")}
          </button>
        ) : null}
        <button
          type="reset"
          onClick={() => {
            if (!isSubmitting) {
              setAmount("")
              setWeightKg("")
              setNotes("")
            }
          }}
          className="rounded-xl bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800"
          disabled={isSubmitting}
        >
          {t("clear")}
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              {t("saving")}
            </>
          ) : mode === "edit" ? (
            t("updateEntry")
          ) : (
            t("save")
          )}
        </button>
      </div>
    </form>
  )
}

/* ====== History table with actions ====== */
function LogsTable({
  logs,
  onEdit,
  onDelete,
  t,
  locale,
}: {
  logs: BabyLog[]
  onEdit: (log: BabyLog) => void
  onDelete: (id: string) => void
  t: ReturnType<typeof useTranslations>
  locale: string
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200/70 text-left text-xs text-neutral-500 dark:border-neutral-800">
            <th className="py-2 pr-3">{t("thDateTime")}</th>
            <th className="py-2 pr-3">{t("thFood")}</th>
            <th className="py-2 pr-3">{t("thAmount")}</th>
            <th className="py-2 pr-3">{t("thWeight")}</th>
            <th className="py-2 pr-3">{t("thNotes")}</th>
            <th className="py-2 pr-3 text-right">{t("thActions")}</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td className="py-3 text-neutral-500" colSpan={6}>
                {t("emptyHistory")}
              </td>
            </tr>
          ) : (
            logs.map((l) => (
              <tr key={l.id} className="border-b border-neutral-100/60 dark:border-neutral-800/60">
                <td className="whitespace-nowrap py-2 pr-3">{formatDateTimeTZ(l.occurredAt, LV_TZ, locale)}</td>
                <td className="py-2 pr-3">{l.foodType}</td>
                <td className="py-2 pr-3">
                  {l.amount} {l.unit}
                </td>
                <td className="py-2 pr-3">{l.weightKg != null ? `${l.weightKg} kg` : t("noDash")}</td>
                <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">{l.notes || t("noDash")}</td>
                <td className="py-2 pr-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(l)}
                      className="inline-flex items-center rounded-lg bg-blue-600/10 px-2 py-1 text-xs text-blue-700 hover:bg-blue-600/20"
                      title={t("editTitle")}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(l.id)}
                      className="inline-flex items-center rounded-lg bg-rose-600/10 px-2 py-1 text-xs text-rose-700 hover:bg-rose-600/20"
                      title={t("deleteTitle")}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ====================== Chart helpers/grafiki ====================== */
function datePartInTZ(iso: string, tz: string = LV_TZ, locale = "lv-LV") {
  try {
    const d = new Date(iso)
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(d)
      .reduce<Record<string, string>>((acc, p) => {
        if (p.type !== "literal") acc[p.type] = p.value
        return acc
      }, {})
    return `${parts.year}-${parts.month}-${parts.day}`
  } catch {
    return ""
  }
}

/** Izveido dienu spaiņus (no vecākās uz jaunāko) */
function buildDayBuckets(n: number) {
  const out: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    out.push({ key: `${yyyy}-${mm}-${dd}`, label: `${dd}.${mm}` })
  }
  return out
}

function ChartCard({
  title,
  subtitle,
  variant,
  logs,
  range,
}: {
  title: string
  subtitle?: string
  variant: "line" | "bar"
  logs: BabyLog[]
  range: "7d" | "30d" | "1y"
}) {
  const daysCount = range === "7d" ? 7 : range === "30d" ? 30 : 365

  const data = useMemo(() => {
    const buckets = buildDayBuckets(daysCount)
    const eatenMap = new Map<string, number>()
    const weightLastMap = new Map<string, number>()

    for (const l of logs) {
      const day = datePartInTZ(l.occurredAt)
      if (!day) continue

      // Apēstais daudzums
      eatenMap.set(day, (eatenMap.get(day) ?? 0) + (Number(l.amount) || 0))

      // Svars — glabā pēdējo šīs dienas vērtību (pieņemot, ka `logs` jau ir desc)
      if (l.weightKg != null) {
        weightLastMap.set(day, Number(l.weightKg))
      }
    }

    if (variant === "line") {
      return buckets.map((b) => ({
        day: b.label,
        weight: weightLastMap.has(b.key) ? (weightLastMap.get(b.key) as number) : null,
      }))
    } else {
      return buckets.map((b) => ({
        day: b.label,
        eaten: eatenMap.get(b.key) ?? 0,
      }))
    }
  }, [logs, range, daysCount, variant])

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-900/60">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-neutral-500">{subtitle}</span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {variant === "line" ? (
            <LineChart data={data as Array<{ day: string; weight: number | null }>}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => (v == null ? "—" : v)} labelFormatter={(l) => `Diena: ${l}`} />
              <Line type="monotone" dataKey="weight" stroke="#ff3366" strokeWidth={3} dot={{ r: 2 }} connectNulls={false} />
            </LineChart>
          ) : (
            <BarChart data={data as Array<{ day: string; eaten: number }>}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => (v == null ? "0" : v)} labelFormatter={(l) => `Diena: ${l}`} />
              <Bar dataKey="eaten" fill="#ff4f75" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ====================== Misc utils ====================== */
function safeDatePart(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ""
  }
}
