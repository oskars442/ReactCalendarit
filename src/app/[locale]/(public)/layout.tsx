// src/app/[locale]/(public)/layout.tsx
import type { ReactNode } from "react";
import HeaderNav from "@/components/HeaderNav";

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  // In Next.js 15 App Router, params can be async; await them.
  params: Promise<{ locale: "lv" | "en" | "ru" }>;
}) {
  const { locale } = await params;

  return (
    <>
      {/* Solid gradient header */}
      <HeaderNav locale={locale} />
      <main>{children}</main>
    </>
  );
}
