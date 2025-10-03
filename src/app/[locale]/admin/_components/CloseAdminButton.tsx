// src/app/admin/_components/CloseAdminButton.tsx
"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CloseAdminButton() {
  const locale = useLocale();
  const router = useRouter();

  const href = `/${locale}/suggestions`;

  return (
    <div className="flex items-center gap-2">
      {/* ESC īsceļš */}
      <button
        onClick={() => router.push(href)}
        className="hidden"
        aria-hidden
      />
      <Link
        href={href}
        aria-label="Close admin"
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"
      >
        ✕ Close
      </Link>
    </div>
  );
}
