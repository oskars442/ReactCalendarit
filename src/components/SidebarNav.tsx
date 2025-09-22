"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "@/lib/i18n/i18n";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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

  /* --------- MOBILE DRAWER STATE + LISTENER --------- */
  const [open, setOpen] = useState(false);

  // aizver, kad maršruts mainās
  useEffect(() => { setOpen(false); }, [pathname]);

  // klausāmies uz HeaderNav sūtīto eventu
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

  const NavList = (
    <nav className="space-y-1 min-w-0">
      {items.map(({ segment, key }) => {
        const href = `${base}/${segment}`;
        const active = cleanPath === href || cleanPath.startsWith(href + "/");
        return (
          <Link
            key={segment}
            href={href}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpen(false)} // mobilajā pēc klikšķa aizveram
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
  );

  const SignOutBlock = (
    <div className="mt-3 min-w-0">
      <div className="pl-1 pr-3">
        <SignOutButton className="w-full" />
      </div>
    </div>
  );

  /* ===== Desktop sidebar ===== */
  const DesktopAside = (
    <aside
      className="hidden md:flex h-full flex-col px-3 pb-4 min-w-0"
      style={{ minWidth: 220 }}
    >
      {NavList}
      {isAuthed ? SignOutBlock : null}
    </aside>
  );

  /* ===== Mobile fullscreen drawer (renderēts portālā uz <body>) ===== */
  const MobileDrawer =
    typeof document !== "undefined"
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

            {/* Panel (pilnekrāna) */}
            <aside
              role="dialog"
              aria-modal="true"
              className={`absolute inset-0 bg-white shadow-xl flex flex-col px-3 pb-4 pt-3
                          transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-neutral-600 truncate max-w-[70%]">
                  {isAuthed ? name : ""}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-md p-2 hover:bg-neutral-100"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto">
                {NavList}
                {isAuthed ? SignOutBlock : null}
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
