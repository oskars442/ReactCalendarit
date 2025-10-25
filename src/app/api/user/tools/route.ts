// src/app/api/user/tools/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { z } from "zod";

// ── Ienākošā ķermeņa validācija ────────────────────────────────────────────
const ToolPayload = z
  .object({
    calendar: z.boolean().optional(),
    diary: z.boolean().optional(),
    tasks: z.boolean().optional(),
    workouts: z.boolean().optional(),
    shopping: z.boolean().optional(),
    weather: z.boolean().optional(),
    baby: z.boolean().optional(),
    stats: z.boolean().optional(),
    projects: z.boolean().optional(),
  })
  .strict();

// Kopīgs select, lai neatkārtotos
const SELECT = {
  calendar: true,
  diary: true,
  tasks: true,
  workouts: true,
  shopping: true,
  weather: true,
  baby: true,
  stats: true,
  projects: true,
} as const;

// Bez kešošanas
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// ── GET: atgriež (un ja vajag – izveido) iestatījumus ─────────────────────
export async function GET() {
  try {
    const userId = await requireUserId();
    const numericUserId = Number(userId); // ✅ konvertējam uz number

    const settings = await prisma.userToolSettings.upsert({
      where: { userId: numericUserId },
      update: {},
      create: { userId: numericUserId },
      select: SELECT,
    });

    return NextResponse.json(settings);
  } catch (err) {
    console.error("GET /api/user/tools error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const numericUserId = Number(userId); // ✅ arī šeit

    const json = await req.json().catch(() => ({}));
    const parsed = ToolPayload.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.userToolSettings.upsert({
      where: { userId: numericUserId },
      update: data,
      create: { userId: numericUserId, ...data },
      select: SELECT,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/user/tools error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}