// src/app/[locale]/(dashboard)/DashboardLayoutClient.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import HeaderNav from "@/components/HeaderNav";
import DashboardShell from "@/components/DashboardShell";
import SidebarNav from "@/components/SidebarNav";
import type { Tools } from "@/types/tools";

type Props = {
  locale: "lv" | "en" | "ru";
  tools: Tools;                 // ← OBLIGĀTS props
  children: ReactNode;
};

export default function DashboardLayoutClient({ locale, tools, children }: Props) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const isWeather = pathname?.includes("/weather");

  useEffect(() => {
    try { const saved = localStorage.getItem("sidebarOpen"); if (saved != null) setOpen(saved === "1"); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("sidebarOpen", open ? "1" : "0"); } catch {}
  }, [open]);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className={isWeather ? "sticky top-0 z-40 bg-transparent" : "sticky top-0 z-40 border-b bg-white/80 backdrop-blur"}>
        <HeaderNav locale={locale} sidebarOpen={open} onToggleSidebar={() => setOpen(v => !v)} />
      </header>

      <DashboardShell
        nav={<SidebarNav locale={locale} tools={tools} />}  // ← ŠEIT JĀBŪT
        open={open}
        noPadding={isWeather}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
