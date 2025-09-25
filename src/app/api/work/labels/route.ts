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
  const b = await req.json().catch(() => ({} as any));

  const name = String(b?.name ?? "").trim();
  let colorHex = String(b?.colorHex ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Missing label name" }, { status: 400 });
  }
  if (!/^#([0-9a-f]{6})$/i.test(colorHex)) colorHex = "#6c757d";

  // Unikāls vārds per user: ja eksistē arhivēta ar tādu pašu vārdu — at-arhivē
  const existing = await prisma.workDiaryLabel.findFirst({
    where: { userId, name },
  });

  const saved = existing
    ? await prisma.workDiaryLabel.update({
        where: { id: existing.id },
        data: { colorHex, archived: false },
      })
    : await prisma.workDiaryLabel.create({
        data: { userId, name, colorHex },
      });

  return NextResponse.json(saved, { status: existing ? 200 : 201 });
}
