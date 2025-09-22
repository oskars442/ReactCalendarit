"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "@/lib/i18n/i18n";
import { useSession } from "next-auth/react";
import SignOutButton from "@/components/SignOutButton";

type Item = { segment: string; key: string };

const items: Item[] = [
  { segment: "dashboard",  key: "overview" },
  { segment: "calendar",   key: "calendar" },
  { segment: "work-diary", key: "workDiary" },
  { segment: "todo",       key: "todo" },
  { segment: "workout",    key: "workout" },
  { segment: "groceries",  key: "groceries" },
  { segment: "weather",    key: "weather" },
  { segment: "stats",      key: "stats" },
];

export default function SidebarNav() {
  const pathname = usePathname() || "/";
  const t = useTranslations("nav");
  const locale = useLocale();
  const { status, data } = useSession();
  const isAuthed = status === "authenticated";
  const name = data?.user?.name || data?.user?.email || "Lietotājs";

  const cleanPath = pathname.split(/[?#]/)[0];
  const base = `/${locale}`;

  return (
    <aside className="flex h-full flex-col px-3 pb-4 min-w-0" style={{ minWidth: 220 }}>
      {/* Greeting ... unchanged */}

      {/* Nav items – fixed height per row (keeps same size across pages) */}
      <nav className="space-y-1 min-w-0">
        {items.map(({ segment, key }) => {
          const href = `${base}/${segment}`;
          const active = cleanPath === href || cleanPath.startsWith(href + "/");
          return (
            <Link
              key={segment}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center rounded-md px-3 text-[15px] transition-colors
                ${active
                  ? "bg-neutral-100 font-semibold text-neutral-900"
                  : "text-neutral-700 hover:bg-neutral-50"}`}
            >
              {t(key)}
            </Link>
          );
        })}
      </nav>

      {/* Sign out right under the last link, with a 2px inset wrapper */}
      <div className="mt-3 min-w-0">
        {/* The wrapper prevents any horizontal overflow and keeps corners visible */}
         <div className="pl-1 pr-3">
          <SignOutButton className="w-full" />
        </div>
      </div>
    </aside>
  );
}