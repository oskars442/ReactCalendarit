"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "@/lib/i18n/i18n";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  { segment: "projects",   key: "projects" },
];

// === DISABLED sadaļas dashboard navigācijai ===
const DISABLED_SEGS_APP = new Set<string>(["stats", "projects"]);

export default function SidebarNav() {
  const pathname = usePathname() || "/";
  const t = useTranslations("nav");
  const locale = useLocale();
  const { status, data } = useSession();
  const isAuthed = status === "authenticated";
  const name = data?.user?.name || data?.user?.email || "Lietotājs";

  // ——— Helpers current route ———
  const cleanPath = useMemo(() => pathname.split(/[?#]/)[0], [pathname]);
  const base = `/${locale}`;

  // ——— Drawer state ———
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // lai portālu nerenderētu SSR laikā
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Mount flag (novērš hydration kļūdas ar createPortal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Aizver, kad maršruts mainās
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Klausāmies uz custom eventiem (no Header u.c.)
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener("sidebar:open", onOpen as EventListener);
    window.addEventListener("sidebar:close", onClose as EventListener);
    return () => {
      window.removeEventListener("sidebar:open", onOpen as EventListener);
      window.removeEventListener("sidebar:close", onClose as EventListener);
    };
  }, []);

  // Esc taustiņš
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Bloķējam body scroll, kad atvērts
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    if (open) root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open, mounted]);

  // Fokusējam aizvēršanas pogu, kad drawer atveras (labāka piekļūstamība)
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  const NavList = (
    <nav className="space-y-1 min-w-0" aria-label="Primary">
      {items.map(({ segment, key }) => {
        const href = `${base}/${segment}`;
        const active = cleanPath === href || cleanPath.startsWith(href + "/");
        const disabled = DISABLED_SEGS_APP.has(segment);

        const baseCls =
          "flex h-10 items-center rounded-md px-3 text-[15px] transition-colors outline-none";
        const enabledCls = active
          ? "bg-neutral-100 font-semibold text-neutral-900"
          : "text-neutral-700 hover:bg-neutral-50 focus:bg-neutral-50";
       const disabledCls = "text-neutral-400 opacity-60 select-none cursor-no-red-xs";

        if (disabled) {
          return (
            <span
              key={segment}
              aria-disabled="true"
              title="Drīzumā"
              className={`${baseCls} ${disabledCls}`}
            >
              {t(key)}
            </span>
          );
        }

        return (
          <Link
            key={segment}
            href={href}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpen(false)} // mobilajā pēc klikšķa aizveram
            className={`${baseCls} ${enabledCls}`}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );

  const SignOutBlock = isAuthed ? (
    <div className="mt-3 min-w-0">
      <div className="pl-1 pr-3">
        <SignOutButton className="w-full" />
      </div>
    </div>
  ) : null;

  // ——— Desktop aside ———
  const DesktopAside = (
    <aside
      className="hidden md:flex h-full flex-col px-3 pb-4 min-w-0"
      style={{ minWidth: 220 }}
      aria-label="Sidebar"
    >
      {NavList}
      {SignOutBlock}
    </aside>
  );

  // ——— Mobile drawer (portāls) ———
  const MobileDrawer =
    mounted
      ? createPortal(
          <div
            className={`md:hidden fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`}
            aria-hidden={!open}
          >
            {/* Backdrop */}
            <div
              className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className={`absolute inset-0 bg-white shadow-xl flex flex-col px-3 pb-4 pt-3
                          transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-neutral-600 truncate max-w-[70%]">
                  {isAuthed ? name : ""}
                </div>
                <button
                  type="button"
                  ref={closeBtnRef}
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-md p-2 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto">
                {NavList}
                {SignOutBlock}
              </div>
            </aside>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {DesktopAside}
      {MobileDrawer}
    </>
  );
}
