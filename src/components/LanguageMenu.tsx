"use client";

import {useMemo, useState, useEffect, useRef} from "react";
import {usePathname, useSearchParams, useRouter} from "next/navigation";

type Lang = "lv" | "en" | "ru";
const LOCALES: Lang[] = ["lv", "en", "ru"];

const FLAGS: Record<Lang, string> = {
  lv: "🇱🇻",
  en: "🇬🇧",
  ru: "🇷🇺",
};

function swapLocaleInPath(pathname: string, next: Lang) {
  // Normalize and swap first segment; if missing, prefix it.
  const parts = pathname.split("/");
  const hasLocale = LOCALES.includes(parts[1] as Lang);
  if (hasLocale) {
    parts[1] = next;
    const joined = parts.join("/");
    return joined.startsWith("/") ? joined : `/${joined}`;
  }
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/${next}${normalized}`;
}

export default function LanguageMenu({ current }: { current: Lang }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  const items = useMemo<Lang[]>(() => LOCALES, []);

  function go(next: Lang) {
    const base = swapLocaleInPath(pathname || "/", next);
    const qs = searchParams?.toString();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    router.push(qs ? `${base}?${qs}${hash}` : `${base}${hash}`);
    setOpen(false);
  }

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          border: "1px solid #e5e7eb",
          background: "#fff",
          borderRadius: 8,
          cursor: "pointer",
          minWidth: 72,
          justifyContent: "center",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Language"
      >
        <span style={{ fontSize: 18 }}>{FLAGS[current]}</span>
        <span style={{ fontWeight: 600, textTransform: "uppercase" }}>{current}</span>
        <span style={{ opacity: 0.6, marginLeft: 4 }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            right: 0,
            marginTop: 6,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,.08)",
            overflow: "hidden",
            zIndex: 40,
            minWidth: 120,
          }}
        >
          {items.map(code => {
            const active = code === current;
            return (
              <button
                key={code}
                role="option"
                aria-selected={active}
                onClick={() => go(code)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  border: "none",
                  background: active ? "#f3f4f6" : "#fff",
                  color: active ? "#111827" : "#374151",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 18 }}>{FLAGS[code]}</span>
                <span style={{ textTransform: "uppercase" }}>{code}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
