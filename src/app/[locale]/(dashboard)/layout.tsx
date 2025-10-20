// src/app/[locale]/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardLayoutClient from "./DashboardLayoutClient";

// Lietotāja saturs – bez kešošanas
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
// Ja kaut kur projektā nejauši iestatīts "edge", vari atkomentēt nākamo rindu:
// export const runtime = "nodejs";

type Params = { locale: "lv" | "en" | "ru" };

export default async function DashboardLayout(props: {
  children: ReactNode;
  // ⬇️ Next.js 15: params ir Promise
  params: Promise<Params>;
}) {
  const { children } = props;
  const { locale } = await props.params; // ⬅️ svarīgi!

  // Server-side sargs: ja nav sesijas → uz sākumlapu attiecīgajā valodā
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${locale}`);
  }

  return (
    <DashboardLayoutClient locale={locale}>
      {children}
    </DashboardLayoutClient>
  );
}
