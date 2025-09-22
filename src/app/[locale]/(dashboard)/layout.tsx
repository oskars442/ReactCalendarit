// src/app/[locale]/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import DashboardLayoutClient from "./DashboardLayoutClient"; // 👈 same folder, correct casing

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: "lv" | "en" | "ru" }>;
}) {
  const { locale } = await params;
  return <DashboardLayoutClient locale={locale}>{children}</DashboardLayoutClient>;
}
