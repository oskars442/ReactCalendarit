"use client";

import React, { useEffect, useMemo, useState } from "react";

/* =============================================
   Types
============================================= */

type TaskStatus = "todo" | "in_progress" | "done";
type Priority = "low" | "medium" | "high";
type ProjectStatus = "active" | "paused" | "completed";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  tags?: string[];
  dueDate?: string; // ISO
};

type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: Priority;
  tags: string[];
  createdAt: string; // ISO
  tasks: Task[];
};

/* =============================================
   Helpers
============================================= */

const uid = () => Math.random().toString(36).slice(2, 9);

function computeProgress(p: Project) {
  const total = p.tasks.length;
  if (!total) return 0;
  const done = p.tasks.filter((t) => t.status === "done").length;
  return Math.round((done / total) * 100);
}

function cn(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return deb;
}

/* =============================================
   Seed (lokāli demo dati — varēsi aizstāt ar API)
============================================= */

const initialProjects: Project[] = [
  {
    id: uid(),
    name: "CalendarIt – Projects UI",
    status: "active",
    priority: "high",
    tags: ["frontend", "calendarit", "ui"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    tasks: [
      { id: uid(), title: "Meklēšana ar debounce", status: "in_progress", tags: ["search"] },
      { id: uid(), title: "Filtri (statuss/priority/tags/laiks)", status: "todo", tags: ["filters"] },
      { id: uid(), title: "Animēts progress bar", status: "done", tags: ["motion"] },
    ],
  },
  {
    id: uid(),
    name: "Workout – Quick Log refactors",
    status: "paused",
    priority: "medium",
    tags: ["workout", "refactor"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    tasks: [
      { id: uid(), title: "QuickLog pārvērst par komponenti", status: "todo", tags: ["component"] },
      { id: uid(), title: "Iekļaut DayDialog", status: "todo", tags: ["integration"] },
    ],
  },
  {
    id: uid(),
    name: "Budget – Charts",
    status: "completed",
    priority: "low",
    tags: ["charts", "analytics"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    tasks: [
      { id: uid(), title: "Income vs Expenses", status: "done" },
      { id: uid(), title: "Laika periodu selektors", status: "done" },
    ],
  },
];

/* =============================================
   Page
============================================= */

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  // Meklēšana
  const [q, setQ] = useState("");
  const qDeb = useDebouncedValue(q, 300);

  // Filtri
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [from, setFrom] = useState<string>(""); // ISO yyyy-mm-dd
  const [to, setTo] = useState<string>("");

  // Ātra projekta pievienošana
  const [newProjectName, setNewProjectName] = useState("");

  // Attēlojamie projekti (meklēšana + filtri)
  const filtered = useMemo(() => {
    const qLower = qDeb.trim().toLowerCase();

    return projects.filter((p) => {
      // Statuss
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      // Prioritāte
      if (priorityFilter !== "all" && p.priority !== priorityFilter) return false;
      // Tags
      if (tagFilter.trim()) {
        const t = tagFilter.trim().toLowerCase();
        if (!p.tags.some((x) => x.toLowerCase().includes(t)) && !p.tasks.some((t2) => t2.tags?.some((x) => x.toLowerCase().includes(t)))) {
          return false;
        }
      }
      // Datumu intervāls (pēc createdAt)
      if (from) {
        const dFrom = new Date(from).getTime();
        if (new Date(p.createdAt).getTime() < dFrom) return false;
      }
      if (to) {
        const dTo = new Date(to).getTime();
        if (new Date(p.createdAt).getTime() > dTo) return false;
      }
      // Meklēšana: projektā nosaukums, tasku nosaukumi, tagi
      if (qLower) {
        const inProjectName = p.name.toLowerCase().includes(qLower);
        const inProjectTags = p.tags.some((t) => t.toLowerCase().includes(qLower));
        const inTasks =
          p.tasks.some(
            (t) =>
              t.title.toLowerCase().includes(qLower) ||
              t.tags?.some((tg) => tg.toLowerCase().includes(qLower))
          );
        if (!(inProjectName || inProjectTags || inTasks)) return false;
      }
      return true;
    });
  }, [projects, qDeb, statusFilter, priorityFilter, tagFilter, from, to]);

  /* =============================================
     Handleri
  ============================================= */

  function addProject() {
    const name = newProjectName.trim();
    if (!name) return;
    const p: Project = {
      id: uid(),
      name,
      status: "active",
      priority: "medium",
      tags: [],
      createdAt: new Date().toISOString(),
      tasks: [],
    };
    setProjects((prev) => [p, ...prev]);
    setNewProjectName("");
  }

  function addTask(projectId: string, title: string) {
    const tTitle = title.trim();
    if (!tTitle) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: [{ id: uid(), title: tTitle, status: "todo", tags: [] }, ...p.tasks],
            }
          : p
      )
    );
  }

  function setTaskStatus(projectId: string, taskId: string, status: TaskStatus) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
            }
          : p
      )
    );
  }

  function toggleDone(projectId: string, taskId: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, status: t.status === "done" ? "todo" : "done" } : t
              ),
            }
          : p
      )
    );
  }

  function setProjectStatus(projectId: string, status: ProjectStatus) {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status } : p))
    );
  }

  function setProjectPriority(projectId: string, priority: Priority) {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, priority } : p))
    );
  }

  /* =============================================
     UI
  ============================================= */

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-white/60">Pārvaldi projektus, uzdevumus un redzi progresu dzīvajā.</p>
        </div>

        {/* Quick add project */}
        <div className="flex w-full gap-2 md:w-auto">
          <input
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/30"
            placeholder="Jauns projekts…"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addProject()}
          />
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 active:translate-y-[1px]"
            onClick={addProject}
          >
            Pievienot
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <input
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/30"
            placeholder="Meklēt projektus/uzdevumus/tagus…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <select
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Statuss: visi</option>
            <option value="active">Aktīvs</option>
            <option value="paused">Pauzēts</option>
            <option value="completed">Pabeigts</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
          >
            <option value="all">Prioritāte: visas</option>
            <option value="high">Augsta</option>
            <option value="medium">Vidēja</option>
            <option value="low">Zema</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <input
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/30"
            placeholder="Tags (piem., ui, api)"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          />
        </div>

        <div className="flex gap-3 md:col-span-2">
          <input
            type="date"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* Projects list */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const progress = computeProgress(p);
          return (
            <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {/* Header row */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        p.priority === "high" && "bg-rose-500",
                        p.priority === "medium" && "bg-amber-500",
                        p.priority === "low" && "bg-emerald-500"
                      )}
                    />
                    <h3 className="truncate text-base font-semibold">{p.name}</h3>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5",
                        p.status === "active" && "bg-emerald-500/15 text-emerald-500",
                        p.status === "paused" && "bg-amber-500/15 text-amber-400",
                        p.status === "completed" && "bg-sky-500/15 text-sky-400"
                      )}
                    >
                      {p.status === "active" ? "Aktīvs" : p.status === "paused" ? "Pauzēts" : "Pabeigts"}
                    </span>
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full border border-white/10 px-2 py-0.5 text-white/70">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick status/priority controls */}
                <div className="flex flex-col items-end gap-2">
                  <select
                    className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs"
                    value={p.status}
                    onChange={(e) => setProjectStatus(p.id, e.target.value as ProjectStatus)}
                  >
                    <option value="active">Aktīvs</option>
                    <option value="paused">Pauzēts</option>
                    <option value="completed">Pabeigts</option>
                  </select>
                  <select
                    className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs"
                    value={p.priority}
                    onChange={(e) => setProjectPriority(p.id, e.target.value as Priority)}
                  >
                    <option value="high">Augsta</option>
                    <option value="medium">Vidēja</option>
                    <option value="low">Zema</option>
                  </select>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-xs text-white/60">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  {/* vienkārša CSS animācija uz width maiņu */}
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-[width] duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Quick add task */}
              <QuickAddTask onAdd={(title) => addTask(p.id, title)} />

              {/* Tasks */}
              <div className="mt-3 space-y-2">
                {p.tasks.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2",
                      t.status === "done" && "opacity-60"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-indigo-500"
                        checked={t.status === "done"}
                        onChange={() => toggleDone(p.id, t.id)}
                        title={t.status === "done" ? "Atzīmēt kā nedarītu" : "Atzīmēt kā pabeigtu"}
                      />
                      <span
                        className={cn(
                          "truncate text-sm",
                          t.status === "done" && "line-through"
                        )}
                        title={t.title}
                      >
                        {t.title}
                      </span>
                    </div>

                    <select
                      className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs"
                      value={t.status}
                      onChange={(e) => setTaskStatus(p.id, t.id, e.target.value as TaskStatus)}
                    >
                      <option value="todo">Darāms</option>
                      <option value="in_progress">Procesā</option>
                      <option value="done">Pabeigts</option>
                    </select>
                  </div>
                ))}

                {p.tasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/50">
                    Šim projektam vēl nav uzdevumu.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          Nekas netika atrasts pēc izvēlētajiem filtriem/meklēšanas.
        </div>
      )}
    </div>
  );
}

/* =============================================
   Mazs iekškomponents: ātra uzdevuma pievienošana
============================================= */

function QuickAddTask({ onAdd }: { onAdd: (title: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/30"
        placeholder="Pievienot uzdevumu…"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onAdd(v);
            setV("");
          }
        }}
      />
      <button
        className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 active:translate-y-[1px]"
        onClick={() => {
          onAdd(v);
          setV("");
        }}
      >
        + Add
      </button>
    </div>
  );
}
