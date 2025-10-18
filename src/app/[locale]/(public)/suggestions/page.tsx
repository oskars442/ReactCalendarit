// src/app/[locale]/(dashboard)/suggestions/page.tsx
"use client";

import { useTranslations, useLocale  } from "next-intl";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SuggestionsForm from "./SuggestionsForm";
import SuggestionsList from "./SuggestionsList";

const ADMIN_EMAILS =
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export default function SuggestionsPage() {
  const t = useTranslations("suggestions");
  const locale = useLocale();
  const { data: session } = useSession();
  const admin =
    (session?.user as any)?.role === "ADMIN" ||
    (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
      .toLowerCase()
      .split(",")
      .map(s => s.trim())
      .includes((session?.user?.email ?? "").toLowerCase());

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* ... */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <SuggestionsForm />
        </div>
 <div className="rounded-2xl border bg-card p-4 shadow-sm">
      {session ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">{t("list.title")}</h2>
            {admin && (
              <Link
                href={`/${locale}/admin/suggestions`}  
                className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
              >
                ⚙️ {t("manage")}
              </Link>
            )}
          </div>
          <SuggestionsList />
        </>
      ) : (
        <div className="rounded-xl border bg-sky-50/50 p-4 text-sky-900">
          🔒 {t("list.loginToView")}
        </div>
      )}
    </div>
      </div>
    </div>
  );
}
