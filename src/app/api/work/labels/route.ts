import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function getUserId() { return 1; }

export async function GET() {
  const userId = await getUserId();
  const labels = await prisma.workDiaryLabel.findMany({
    where: { userId, archived: false },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(labels);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const b = await req.json();
  const name = String(b?.name ?? "").trim();
  let colorHex = String(b?.colorHex ?? "").trim();
  if (!name) return NextResponse.json({ error: "Missing label name" }, { status: 400 });
  if (!/^#([0-9a-f]{6})$/i.test(colorHex)) colorHex = "#6c757d";

  const saved = await prisma.workDiaryLabel.upsert({
    where: { uniq_diarylabel_user_name: { userId, name } },
    create: { userId, name, colorHex },
    update: { colorHex, archived: false },
  });

  return NextResponse.json(saved, { status: 201 });
}
