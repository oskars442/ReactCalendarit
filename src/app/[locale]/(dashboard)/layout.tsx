// src/app/[locale]/(dashboard)/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardLayoutClient from "./DashboardLayoutClient";
import type { Tools } from '@/types/tools';

// Lietotāja saturs – bez kešošanas
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
// Ja kaut kur projektā nejauši iestatīts "edge", vari atkomentēt nākamo rindu:
// export const runtime = "nodejs";

type Params = { locale: "lv" | "en" | "ru" };

// Tips, ko nododam klientam (sakrīt ar UserToolSettings laukiem)
export type Tools = {
  calendar: boolean;
  diary: boolean;
  tasks: boolean;
  workouts: boolean;
  shopping: boolean;
  weather: boolean;
  baby: boolean;
  stats: boolean;
  projects: boolean;
};

const DEFAULT_TOOLS: Tools = {
  calendar: true,
  diary: true,
  tasks: true,
  workouts: true,
  shopping: true,
  weather: true,
  baby: true,
  stats: false,
  projects: false,
};

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

  // Iegūstam userId (ja NextAuth sesijā nav id, ņemam pēc email)
  let userId: number | null = null;
  if (typeof (session.user as any)?.id === "number") {
    userId = (session.user as any).id as number;
  } else if (session.user?.email) {
    const u = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { id: true },
    });
    userId = u?.id ?? null;
  }

  if (!userId) {
    // drošības pēc – ja kaut kas nav kārtībā ar sesiju
    redirect(`/${locale}`);
  }

  // Ielādējam rīku iestatījumus (ja nav – izveido ar defaultiem)
  const toolsRow = await prisma.userToolSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: {
      calendar: true,
      diary: true,
      tasks: true,
      workouts: true,
      shopping: true,
      weather: true,
      baby: true,
      stats: true,
      projects: true,
    },
  });

  const tools: Tools = toolsRow ?? DEFAULT_TOOLS;

  return (
    <DashboardLayoutClient locale={locale} tools={tools}>
      {children}
    </DashboardLayoutClient>
  );
}
