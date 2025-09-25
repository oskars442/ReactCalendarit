// src/app/api/work/labels/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const userId = await requireUserId();

    const labels = await prisma.workDiaryLabel.findMany({
      where: { userId, archived: false },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(labels);
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return NextResponse.json({ error: "Failed to load labels." }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const b = await req.json().catch(() => ({} as any));

    // --- validate ---
    const rawName = String(b?.name ?? "").trim();
    if (!rawName) {
      return NextResponse.json({ error: "Missing label name" }, { status: 400 });
    }
    let colorHex = String(b?.colorHex ?? "").trim().toLowerCase();
    if (!/^#([0-9a-f]{6})$/.test(colorHex)) colorHex = "#6c757d";

    // --- prevent dupes case-insensitively ---
    // Ja eksistē (pat ar citu burtu lielumu) – atjauninām to pašu ierakstu
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
    // Var trāpīt uz unikālā indeksa kļūdu (ja vienlaicīgi izsauc ar citu “case”)
    // Prisma P2002 → unique constraint failed
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Label with this name already exists." },
        { status: 409 }
      );
    }
    const status = e?.status === 401 ? 401 : 500;
    return NextResponse.json({ error: "Failed to save label." }, { status });
  }
}
