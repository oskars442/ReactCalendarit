//// app/[locale]/(dashboard)/baby-tracker/ui.tsx

'use client'
/**
 * BabyTrackerClient (MVP) — LV time edition (Europe/Riga)
 * - Ieraksts caur modāli (+Jauns ieraksts / Rediģēt)
 * - Laika josla + Vēsture zem kopsavilkuma
 * - Zīdaiņa select + “+ Bērns”
 * - Visi laiki Rīgas TZ
 * - 1. variants: Darbības kolonna tabulā (✏️/🗑️)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

/* ✅ Recharts importi — PIELIKU (statistikas daļai) */
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
} from 'recharts'

/* ====================== LV time helpers ====================== */
const LV_TZ = 'Europe/Riga'

/** YYYY-MM-DDTHH:mm priekš <input type="datetime-local"> (Rīgas laikā) */
function nowForInput(tz: string = LV_TZ, locale = 'lv-LV') {
  const pad = (n: string | number) => String(n).padStart(2, '0')
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value
      return acc
    }, {})
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`
}

/** Tikai datums YYYY-MM-DD Rīgas laikā */
function todayDateInTZ(tz: string = LV_TZ) {
  return nowForInput(tz).slice(0, 10)
}

/** “HH:mm” Rīgas laikā no ISO/Date-string */
function formatTimeTZ(iso: string, tz: string = LV_TZ, locale = 'lv-LV') {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso))
  } catch { return '—' }
}

/** “DD.MM.YYYY HH:mm” (locale) Rīgas laikā no ISO/Date-string */
function formatDateTimeTZ(iso: string, tz: string = LV_TZ, locale = 'lv-LV') {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso))
  } catch { return iso }
}

/* ====================== Types ====================== */
type BabyLog = {
  id: string
  userId: string
  babyId?: string | null
  occurredAt: string // ISO
  foodType: string
  amount: number
  unit: 'ml' | 'g' | string
  weightKg?: number | null
  notes?: string | null
}

type Baby = { id: string; name: string; birth?: string | null }

/* ====================== Page ====================== */
export default function BabyTrackerClient({ initialLogs }: { initialLogs: BabyLog[] }) {
    
  const router = useRouter()

  
  // State
  const [logs, setLogs] = useState<BabyLog[]>(initialLogs)
  const [range, setRange] = useState<'7d' | '30d' | '1g'>('7d')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<BabyLog | null>(null)

  // Babies (demo; vēlāk aizstāt ar DB)
 const [babyOpen, setBabyOpen] = useState(false)
 const [babies, setBabies] = useState<Baby[]>([])
 const [selectedBaby, setSelectedBaby] = useState<string>("")

  // Šodien (Rīgas laikā)
  const todayISO = todayDateInTZ()

  // Stats (šodiena Rīgas laikā)
  const stats = useMemo(() => {
    const todayLogs = logs.filter(l => safeDatePart(l.occurredAt) === todayISO)
    const totalFeeds = todayLogs.length
    const totalAmount = todayLogs.reduce((s, l) => s + (Number(l.amount) || 0), 0)
    const last = todayLogs.at(0)?.occurredAt || '—' // serveris sūta desc
    return { totalFeeds, totalAmount, last }
  }, [logs, todayISO])

  const visibleLogs = useMemo(
  () => (selectedBaby ? logs.filter(l => l.babyId === selectedBaby) : logs),
  [logs, selectedBaby]
)
  // Reload by range
  async function reload(newRange: '7d' | '30d' | '1g' = range) {
    try {
      setRange(newRange)
      const days = newRange === '7d' ? 7 : newRange === '30d' ? 30 : 365
      const res = await fetch(`/api/baby-logs?days=${days}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load logs')
      const data = await res.json()
      setLogs(data.logs)
    } catch (e) {
      console.error(e)
    }
  }

  // Create
  async function createLog(payload: LogPayload) {
    try {
      const body = { ...payload, babyId: selectedBaby || null }
      const res = await fetch('/api/baby-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create log')
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update log')
      await reload(range)
    } catch (e) {
      console.error(e)
    }
  }

  // Delete
  async function handleDelete(id: string) {
    if (!confirm('Vai tiešām dzēst šo ierakstu?')) return
    try {
      const res = await fetch(`/api/baby-logs/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
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
    if (selectedBaby && list.some(b => b.id === selectedBaby)) {
      // paturi esošo izvēli
      return
    }
    if (list.length === 1) {
      setSelectedBaby(list[0].id)   // auto-select ja tieši 1
    } else {
      setSelectedBaby("")            // liekam izvēlēties
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
    <div className="min-h-screen w-full bg-gradient-to-b from-rose-50 to-white dark:from-neutral-950 dark:to-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/50 border-b border-neutral-200/70 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 grid place-items-center" aria-hidden>
            <span className="text-rose-500 text-lg">🍼</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold leading-tight truncate">Mazuļu ēdienreižu uzskaite</h1>
          </div>

          {/* Baby select + actions */}
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="babySelect">Zīdainis</label>
           <select
  id="babySelect"
  value={selectedBaby}
  onChange={(e) => setSelectedBaby(e.target.value)}
  className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3 py-2 text-sm"
>
  <option value="" disabled>👶 Izvēlies zīdaini…</option>
  {babies.map(b => (
    <option key={b.id} value={b.id}>👶 {b.name}</option>
  ))}
</select>

            <button
              type="button"
              onClick={() => setBabyOpen(true)}
              className="rounded-xl px-3 py-2 text-sm bg-white/70 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800"
            >
              + Bērns
            </button>

            <button
              type="button"
              onClick={() => { setEditingLog(null); setModalOpen(true) }}
              className="rounded-xl px-3 py-2 text-sm font-medium bg-rose-500 text-white shadow-sm hover:shadow transition"
            >
              + Jauns ieraksts
            </button>
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Summary (3 cards) */}
        <section className="lg:col-span-12 grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Barošanas reizes šodien" value={stats.totalFeeds} hint="reizes" />
          <StatCard label="Šodien apēsts" value={stats.totalAmount} hint="ml/g" />
          <StatCard label="Pēdējais ēšanas laiks" value={stats.last === '—' ? '—' : formatTimeTZ(stats.last)} />
        </section>

        {/* Timeline + Table */}
        <section className="lg:col-span-12 grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-2 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Šodienas laika josla</h2>
            <Timeline logs={logs.filter(l => safeDatePart(l.occurredAt) === todayISO).slice(0, 8)} />
          </div>

          <div className="xl:col-span-3 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm overflow-hidden">
            <h2 className="font-semibold mb-3">Vēsture</h2>
            <LogsTable
  logs={visibleLogs}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
          </div>
        </section>

        {/* ===== Statistika — ŠEIT TIKAI IZMAIŅAS ===== */}
        <section className="lg:col-span-12 grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Statistika</h2>
            <div className="inline-flex rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
              {(['7d', '30d', '1g'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => reload(r)}
                  className={`px-3 py-1.5 text-sm ${range === r ? 'bg-rose-500 text-white' : 'bg-white/70 dark:bg-neutral-900/60'}`}
                  aria-pressed={range === r}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ Aizvietoju placeholderus ar īstiem Recharts un pievienoju datu agregāciju */}
          <ChartCard title="Svara izmaiņas" subtitle="kg" variant="line" logs={logs} range={range} />
          <ChartCard title="Apēstais daudzums / dienā" subtitle="ml / g" variant="bar" logs={logs} range={range} />
        </section>
      </main>

      {/* ===== Modals ===== */}
      {babyOpen && (
        <Modal onClose={() => setBabyOpen(false)} title="Pievienot zīdaini">
          <AddBabyForm
  onAdd={(baby) => {
    // ieliekam jaunpievienoto bez pilna reload, lai UI uzreiz dzīvs
    setBabies(p => [...p, baby])
    setSelectedBaby(baby.id)   // auto-izvēlamies svaigi izveidoto
    setBabyOpen(false)
  }}
/>
        </Modal>
      )}

      {modalOpen && (
        <Modal
          onClose={() => { setModalOpen(false); setEditingLog(null) }}
          title={editingLog ? 'Rediģēt ierakstu' : 'Jauns ieraksts'}
          subtitle="Pievieno/rediģē barošanas informāciju un (opc.) svaru"
        >
          <QuickAdd
            initial={editingLog ? {
              occurredAt: editingLog.occurredAt,
              foodType: editingLog.foodType,
              amount: editingLog.amount,
              unit: editingLog.unit as 'ml'|'g',
              weightKg: editingLog.weightKg ?? null,
              notes: editingLog.notes ?? '',
            } : undefined}
            onAdd={async (p) => {
              if (editingLog) {
                await updateLog(editingLog.id, p)
              } else {
                await createLog(p)
              }
              setModalOpen(false)
              setEditingLog(null)
            }}
            onCancel={() => { setModalOpen(false); setEditingLog(null) }}
            mode={editingLog ? 'edit' : 'create'}
          />
        </Modal>
      )}
    </div>
  )
}

/* ====================== Subcomponents ====================== */
function Timeline({ logs }: { logs: BabyLog[] }) {
  if (!logs?.length)
    return <div className="text-sm text-neutral-500">Šodien nav ierakstu</div>

  return (
    <ol className="relative border-s border-neutral-200 dark:border-neutral-800 ml-3">
      {logs.slice(0, 8).map((l) => (
        <li key={l.id} className="ms-6 py-3">
          <span className="absolute -start-1.5 mt-2 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-neutral-500">{formatTimeTZ(l.occurredAt)}</div>
            <div className="text-xs rounded-full px-2 py-0.5 bg-rose-500/10 text-rose-600">
              {l.foodType}
            </div>
          </div>
          <div className="mt-1 text-sm">
            <span className="font-medium">{l.amount} {l.unit}</span>
            {l.weightKg != null ? <span className="text-neutral-500"> · {l.weightKg} kg</span> : null}
          </div>
{l.notes && (
  <div className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap break-words">
    {l.notes}
  </div>
)}
        </li>
      ))}
    </ol>
  )
}


function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold leading-none">{value}</div>
      {hint ? <div className="text-xs text-neutral-400 mt-1">{hint}</div> : null}
    </div>
  )
}

function AddBabyForm({ onAdd }: { onAdd: (b: Baby) => void }) {
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
        birth: birth || undefined, // '' -> undefined
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
        <label className="text-xs text-neutral-500">Vārds</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="piem., Laura" />
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">Dzimšanas datums</label>
        <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className="input" />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={() => { setName(''); setBirth('') }} className="rounded-xl px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800">Notīrīt</button>
        <button type="submit" className="rounded-xl px-4 py-2 text-sm font-medium bg-rose-500 text-white">Saglabāt</button>
      </div>
    </form>
  )
}

function Modal({ onClose, title, subtitle, children }: { onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-lg rounded-2xl border border-neutral-200/70 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold">{title}</h3>
            {subtitle ? <p className="text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
          </div>
        <button onClick={onClose} className="rounded-xl px-2 py-1 text-sm bg-neutral-100 dark:bg-neutral-800" aria-label="Aizvērt">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ====== Create/Edit form in modal ====== */
type LogPayload = {
  occurredAt: string
  foodType: string
  amount: number
  unit: 'ml' | 'g' | string
  weightKg: number | null
  notes: string
}

function QuickAdd({
  onAdd,
  onCancel,
  initial,
  mode = 'create',
}: {
  onAdd: (row: LogPayload) => void
  onCancel?: () => void
  initial?: Partial<LogPayload>
  mode?: 'create' | 'edit'
}) {
  // sākuma vērtība — Rīgas laiks vai sākotnējie dati rediģēšanai
  const [dt, setDt] = useState(() => {
    if (initial?.occurredAt) {
      // pārvēršam ISO uz datetime-local formātu
      const d = new Date(initial.occurredAt)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const mi = String(d.getMinutes()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
    }
    return nowForInput()
  })
  const [food, setFood] = useState(initial?.foodType ?? 'Mātes piens')
  const [amount, setAmount] = useState<string>(initial?.amount != null ? String(initial.amount) : '')
  const [unit, setUnit] = useState<'ml' | 'g'>((initial?.unit as 'ml'|'g') ?? 'ml')
  const [weightKg, setWeightKg] = useState<string>(initial?.weightKg != null ? String(initial.weightKg) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  useEffect(() => {
    // ja ienāk citi initial (reti), sinhronizējam
    if (!initial) return
    if (initial.occurredAt) {
      const d = new Date(initial.occurredAt)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const mi = String(d.getMinutes()).padStart(2, '0')
      setDt(`${yyyy}-${mm}-${dd}T${hh}:${mi}`)
    }
    if (initial.foodType) setFood(initial.foodType)
    if (initial.amount != null) setAmount(String(initial.amount))
    if (initial.unit) setUnit(initial.unit as 'ml'|'g')
    if (initial.weightKg != null) setWeightKg(String(initial.weightKg))
    if (initial.notes != null) setNotes(initial.notes)
  }, [initial])

  const canSubmit = amount !== '' // minimāla validācija

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSubmit) return
        onAdd({
          occurredAt: new Date(dt).toISOString(),
          foodType: food,
          amount: Number(amount || 0),
          unit,
          weightKg: weightKg === '' ? null : Number(weightKg),
          notes,
        })
      }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">Datums / laiks</label>
        <input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} className="input" />
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">Ēdiena veids</label>
        <select value={food} onChange={(e) => setFood(e.target.value)} className="input">
          <option>Maisījums</option>
          <option>Mātes piens</option>
          <option>Putriņa</option>
          <option>Dārzeņi</option>
          <option>Augļi</option>
          <option>Ūdens</option>
          <option>Cits…</option>
        </select>
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">Daudzums</label>
        <div className="flex gap-2">
          <input type="number" min={0} step="1" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="input flex-1" />
          <select value={unit} onChange={(e) => setUnit(e.target.value as 'ml' | 'g')} className="input w-24">
            <option>ml</option>
            <option>g</option>
          </select>
        </div>
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-neutral-500">Bērna svars (opc.)</label>
        <input type="number" min={0} step="0.01" placeholder="kg" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="input" />
      </div>
      <div className="sm:col-span-2 grid gap-1">
        <label className="text-xs text-neutral-500">Piezīmes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="piem.: ēda ātri, atgrieza u.tml." className="input min-h-[70px]" />
      </div>
      <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800">Atcelt</button>
        ) : null}
        <button type="reset" onClick={() => { setAmount(''); setWeightKg(''); setNotes('') }} className="rounded-xl px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800">Notīrīt</button>
        <button type="submit" disabled={!canSubmit} className="rounded-xl px-4 py-2 text-sm font-medium bg-rose-500 text-white shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed">
          {mode === 'edit' ? 'Atjaunināt ierakstu' : 'Saglabāt'}
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
}: {
  logs: BabyLog[]
  onEdit: (log: BabyLog) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-neutral-500 border-b border-neutral-200/70 dark:border-neutral-800">
            <th className="py-2 pr-3">Datums / laiks</th>
            <th className="py-2 pr-3">Ēdiens</th>
            <th className="py-2 pr-3">Daudzums</th>
            <th className="py-2 pr-3">Svars</th>
            <th className="py-2 pr-3">Piezīmes</th>
            <th className="py-2 pr-3 text-right">Darbības</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td className="py-3 text-neutral-500" colSpan={6}>Nav datu.</td></tr>
          ) : (
            logs.map((l) => (
              <tr key={l.id} className="border-b border-neutral-100/60 dark:border-neutral-800/60">
                <td className="py-2 pr-3 whitespace-nowrap">{formatDateTimeTZ(l.occurredAt)}</td>
                <td className="py-2 pr-3">{l.foodType}</td>
                <td className="py-2 pr-3">{l.amount} {l.unit}</td>
                <td className="py-2 pr-3">{l.weightKg != null ? `${l.weightKg} kg` : '—'}</td>
                <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">{l.notes || '—'}</td>
                <td className="py-2 pr-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(l)}
                      className="inline-flex items-center rounded-lg px-2 py-1 text-xs bg-blue-600/10 text-blue-700 hover:bg-blue-600/20"
                      title="Rediģēt"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(l.id)}
                      className="inline-flex items-center rounded-lg px-2 py-1 text-xs bg-rose-600/10 text-rose-700 hover:bg-rose-600/20"
                      title="Dzēst"
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

/* ====================== Chart placeholders -> PĀRVEIDOTS UZ īstajiem grafikiem ====================== */
/* Palīdz-funkcija tikai šai sadaļai: YYYY-MM-DD LV laikā */
function datePartInTZ(iso: string, tz: string = LV_TZ, locale = 'lv-LV') {
  try {
    const d = new Date(iso)
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(d).reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value
      return acc
    }, {})
    return `${parts.year}-${parts.month}-${parts.day}` // YYYY-MM-DD
  } catch { return '' }
}

/** Izveido dienu spaiņus (no vecākās uz jaunāko) */
function buildDayBuckets(n: number) {
  const out: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
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
  variant: 'line' | 'bar'
  logs: BabyLog[]
  range: '7d' | '30d' | '1g'
}) {
  const daysCount = range === '7d' ? 7 : range === '30d' ? 30 : 365

  // Agregācija pa dienām LV laikā
  const data = useMemo(() => {
    const buckets = buildDayBuckets(daysCount)
    const eatenMap = new Map<string, number>()        // sum(amount) per day
    const weightLastMap = new Map<string, number>()   // pēdējais svars dienā

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

    if (variant === 'line') {
      return buckets.map(b => ({
        day: b.label,
        weight: weightLastMap.has(b.key) ? weightLastMap.get(b.key)! : null, // null -> pārrāvums
      }))
    } else {
      return buckets.map(b => ({
        day: b.label,
        eaten: eatenMap.get(b.key) ?? 0,
      }))
    }
  }, [logs, range, daysCount, variant])

  return (
    <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-neutral-500">{subtitle}</span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'line' ? (
            <LineChart data={data as Array<{ day: string; weight: number | null }>} >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: any) => (v == null ? '—' : v)}
                labelFormatter={(l) => `Diena: ${l}`}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#ff3366"
                strokeWidth={3}
                dot={{ r: 2 }}
                connectNulls={false}
              />
            </LineChart>
          ) : (
            <BarChart data={data as Array<{ day: string; eaten: number }>}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: any) => (v == null ? '0' : v)}
                labelFormatter={(l) => `Diena: ${l}`}
              />
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
  try { return new Date(iso).toISOString().slice(0, 10) } catch { return '' }
}
