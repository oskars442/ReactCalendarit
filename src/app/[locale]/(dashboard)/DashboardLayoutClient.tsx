// src/app/[locale]/(dashboard)/DashboardLayoutClient.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import HeaderNav from "@/components/HeaderNav";
import DashboardShell from "@/components/DashboardShell";
import SidebarNav from "@/components/SidebarNav";

export default function DashboardLayoutClient({
  locale,
  children,
}: {
  locale: "lv" | "en" | "ru";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const isWeather = pathname?.includes("/weather"); // ← tikai laikapstākļu lapai

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebarOpen");
      if (saved != null) setOpen(saved === "1");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebarOpen", open ? "1" : "0");
    } catch {}
  }, [open]);

  return (
    <div className="min-h-dvh flex flex-col">
      <header
        className={
          isWeather
            ? "sticky top-0 z-40 bg-transparent" // bez border un baltā fona
            : "sticky top-0 z-40 border-b bg-white/80 backdrop-blur"
        }
      >
        <HeaderNav
          locale={locale}
          sidebarOpen={open}
          onToggleSidebar={() => setOpen((v) => !v)}
        />
      </header>

      {/* noPadding = true tikai weather lapai */}
      <DashboardShell nav={<SidebarNav />} open={open} noPadding={isWeather}>
        {children}
      </DashboardShell>
    </div>
  );
}
