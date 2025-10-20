// src/app/api/work/labels/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";

/** Nolasām userId un pārvēršam par number (ja nav derīgs -> 401) */
async function getUserIdNumber(req: Request): Promise<number> {
  const raw = await requireUserId(req as any);
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (!Number.isFinite(n)) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return n;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserIdNumber(req);

    const labels = await prisma.workDiaryLabel.findMany({
      where: { userId, archived: false },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(labels, { status: 200 });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    if (status === 500) console.error("[/api/work/labels] GET failed:", e);
    return NextResponse.json({ error: "Failed to load labels." }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdNumber(req);
    const b = await req.json().catch(() => ({} as any));

    // --- validate ---
    const rawName = String(b?.name ?? "").trim();
    if (!rawName) {
      return NextResponse.json({ error: "Missing label name" }, { status: 400 });
    }
    let colorHex = String(b?.colorHex ?? "").trim().toLowerCase();
    if (!/^#([0-9a-f]{6})$/.test(colorHex)) colorHex = "#6c757d";

    // --- prevent dupes (case-insensitive) ---
    const existingCI = await prisma.workDiaryLabel.findFirst({
      where: {
        userId,
        name: { equals: rawName, mode: "insensitive" },
      },
    });

    const saved = existingCI
      ? await prisma.workDiaryLabel.update({
          where: { id: existingCI.id },
          data: { name: rawName, colorHex, archived: false },
        })
      : await prisma.workDiaryLabel.create({
          data: { userId, name: rawName, colorHex },
        });

    return NextResponse.json(saved, { status: existingCI ? 200 : 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      // unique constraint
      return NextResponse.json(
        { error: "Label with this name already exists." },
        { status: 409 }
      );
    }
    const status = e?.status === 401 ? 401 : 500;
    if (status === 500) console.error("[/api/work/labels] POST failed:", e);
    return NextResponse.json({ error: "Failed to save label." }, { status });
  }
}
