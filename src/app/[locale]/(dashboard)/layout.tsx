// src/app/[locale]/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardLayoutClient from "./DashboardLayoutClient";

// ❗Izslēdzam jebkādu kešošanu user-saturam
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Params = { locale: "lv" | "en" | "ru" };

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  // Server-side sargs: ja nav sesijas → uz sākumlapu konkrētajā valodā
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${params.locale}`);
  }

  return (
    <DashboardLayoutClient locale={params.locale}>
      {children}
    </DashboardLayoutClient>
  );
}
