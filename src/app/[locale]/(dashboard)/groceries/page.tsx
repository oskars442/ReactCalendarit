// src/app/[locale]/(dashboard)/groceries/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations } from "@/lib/i18n/i18n";
import { useRouter, useSearchParams } from "next/navigation";

type GroceryItem = {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string; // ISO
  list?: string;
};

type ListDef = { key: string; label: string };

export default function Groceries() {
  const t = useTranslations("groceries");
  const router = useRouter();
  const sp = useSearchParams();

  // Tikai 2 saraksti (centrēti)
  const LISTS: ListDef[] = useMemo(
    () => [
      { key: "daily",    label: t("lists.daily") },    // Ikdienišķais grozs
      { key: "longterm", label: t("lists.longterm") }, // Ilgtermiņa lielie pirkumi
    ],
    [t]
  );
  const ALLOWED = new Set(LISTS.map(l => l.key));

  // Sākotnējā vērtība + normalizācija
  const initial = sp.get("list") || "daily";
  const [currentList, setCurrentList] = useState<string>(ALLOWED.has(initial) ? initial : "daily");

  // URL sync bez pārlādes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("list") !== currentList) {
      url.searchParams.set("list", currentList);
      router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false });
    }
  }, [currentList, router]);

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const qs = new URLSearchParams({ list: currentList });
    const res = await fetch(`/api/groceries?${qs}`, { cache: "no-store" });
    const data = await res.json();
    setItems(data.items ?? []);
  }, [currentList]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { await refetch(); } finally { setLoading(false); }
    })();
  }, [refetch]);

  useEffect(() => {
    const onChanged = () => { void refetch(); };
    window.addEventListener("calendarit:groceriesChanged", onChanged);
    return () => window.removeEventListener("calendarit:groceriesChanged", onChanged);
  }, [refetch]);

  async function mutate(
    optimistic: (prev: GroceryItem[]) => GroceryItem[],
    doRequest: () => Promise<void>
  ) {
    let rollback: GroceryItem[] = [];
    setItems(prev => { rollback = prev; return optimistic(prev); });
    try { await doRequest(); } catch { setItems(rollback); }
  }

  async function addItem() {
    const text = newItem.trim();
    if (!text) return;
    const tempId = -Date.now();

    await mutate(
      prev => [...prev, { id: tempId, text, completed: false, createdAt: new Date().toISOString(), list: currentList }],
      async () => {
        const res = await fetch("/api/groceries", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text, list: currentList }),
        });
        if (!res.ok) throw new Error("create");
        const { item } = await res.json();
        setItems(prev => prev.map(it => (it.id === tempId ? item : it)));
      }
    );
    setNewItem("");
  }

  async function toggleItem(id: number) {
    const current = items.find(x => x.id === id);
    if (!current) return;
    await mutate(
      prev => prev.map(x => (x.id === id ? { ...x, completed: !x.completed } : x)),
      async () => {
        const res = await fetch(`/api/groceries/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ completed: !current.completed }),
        });
        if (!res.ok) throw new Error("toggle");
      }
    );
  }

  async function deleteItem(id: number) {
    await mutate(
      prev => prev.filter(x => x.id !== id),
      async () => {
        const res = await fetch(`/api/groceries/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("delete");
      }
    );
  }

  async function clearCompleted() {
    const ids = items.filter(i => i.completed).map(i => i.id);
    if (ids.length === 0) return;
    const backup = items;
    setItems(prev => prev.filter(i => !i.completed));
    try { await Promise.all(ids.map(id => fetch(`/api/groceries/${id}`, { method: "DELETE" }))); }
    catch { setItems(backup); }
  }

  const doneCount = items.filter(i => i.completed).length;

  if (loading) {
    return (
      <div className="mx-auto max-w-xl rounded-xl bg-white p-6 text-center text-gray-600 shadow dark:bg-gray-900 dark:text-gray-300">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow">
        <h1 className="text-2xl font-semibold">🛒 {t("title")}</h1>
        <p className="opacity-90">{t("subtitle")}</p>
      </div>

      {/* Tabs (centrēti) */}
      <div className="mt-4 flex justify-center">
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {LISTS.map((l) => {
            const active = l.key === currentList;
            return (
              <button
                key={l.key}
                onClick={() => setCurrentList(l.key)}
                className={`min-w-[150px] rounded-lg px-4 py-2 text-sm transition
                  ${active
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"}`}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add item */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex gap-3 max-sm:flex-col">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder={t("placeholder")}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800"
          />
          <button
            onClick={addItem}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 active:translate-y-px"
          >
            {t("addBtn")}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {t("currentList")}: <b>{LISTS.find(l => l.key === currentList)?.label ?? currentList}</b>
        </p>
      </div>

      {/* List / Empty */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {items.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <p>{t("empty.title")}</p>
            <p className="text-sm opacity-80">{t("empty.subtitle")}</p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300 max-sm:flex-col max-sm:gap-2">
              <div className="flex gap-4">
                <span>{t("stats.total")}: <b>{items.length}</b></span>
                <span>{t("stats.completed")}: <b>{doneCount}</b></span>
              </div>
              {doneCount > 0 && (
                <button onClick={clearCompleted} className="rounded-md bg-rose-600 px-3 py-1 text-white transition hover:bg-rose-500">
                  {t("clearCompleted")}
                </button>
              )}
            </div>

            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 transition hover:-translate-y-0.5 hover:shadow ${
                    item.completed
                      ? "border-blue-200 bg-blue-50 opacity-90 dark:border-blue-900/40 dark:bg-blue-900/20"
                      : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                  }`}
                >
                  <div className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleItem(item.id)}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <span className={`text-sm text-gray-800 dark:text-gray-100 ${item.completed ? "line-through text-gray-500 dark:text-gray-400" : ""}`}>
                      {item.text}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    aria-label={t("deleteAria")}
                    className="rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
