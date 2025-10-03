// src/app/[locale]/(dashboard)/suggestions/SuggestionsList.tsx
"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";

type Item = {
  id: number;
  content: string;
  createdAt: string;
  status: "NEW"|"PLANNED"|"IN_PROGRESS"|"DONE"|"REJECTED";
  pinned: boolean;
  hidePublic: boolean;
  name: string | null;
  isAnonymous: boolean;
};

const fetcher = (u: string) => fetch(u).then(r => {
  if (r.status === 401) throw new Error("unauth");
  return r.json();
});

export default function SuggestionsList() {
  const t = useTranslations("suggestions");
  const { data, isLoading, error } = useSWR<{ ok: boolean; data: Item[] }>("/api/suggestions", fetcher);

  if (isLoading) return <div className="animate-pulse h-32 rounded-xl bg-muted" />;
  if (error) return <div className="text-sm text-muted-foreground">Neizdevās ielādēt.</div>;
  const items = data?.data ?? [];

  if (!items.length) return <div className="text-sm text-muted-foreground">{t("list.empty", { default: "Pagaidām nav ieteikumu." })}</div>;

  const s = t.raw("status") as Record<Item["status"], string>;

  return (
    <div className="divide-y">
      {items.map((i) => (
        <div key={i.id} className="py-4">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="inline-flex rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5">
              {s[i.status] ?? i.status}
            </span>
            {i.pinned && (
              <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-purple-800">📌 Pinned</span>
            )}
            <span className="text-muted-foreground">
              {new Date(i.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{i.content}</p>
          <div className="mt-1 text-xs text-muted-foreground">
            {i.isAnonymous ? "Anonīms" : (i.name ?? "—")}
          </div>
        </div>
      ))}
    </div>
  );
}
