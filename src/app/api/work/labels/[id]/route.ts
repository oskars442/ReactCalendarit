import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// TODO: aizstāj ar savu autentifikāciju
async function getUserId() { return 1; }

/**
 * DELETE /api/work/labels/:id
 * Soft-delete: archived = true
 */
export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const userId = await getUserId();
  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Pārbaudi, ka etiķete pieder lietotājam
  const existing = await prisma.workDiaryLabel.findFirst({
    where: { id, userId, archived: false },
  });
  if (!existing) {
    // 404, ja nepastāv vai nepieder
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.workDiaryLabel.update({
    where: { id },
    data: { archived: true },
  });

  return new NextResponse(null, { status: 204 });
}

/**
 * PATCH /api/work/labels/:id
 * Ļauj mainīt nosaukumu/krāsu. Ja name mainās, saglabājam unikālumu konkrētam useram.
 */
export async function PATCH(
  req: Request,
  ctx: { params: { id: string } }
) {
  const userId = await getUserId();
  const id = Number(ctx.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({} as any));
  const nextNameRaw = typeof body?.name === "string" ? body.name : undefined;
  const nextColorRaw = typeof body?.colorHex === "string" ? body.colorHex : undefined;

  let name = nextNameRaw?.trim();
  let colorHex = nextColorRaw?.trim();

  if (colorHex && !/^#([0-9a-f]{6})$/i.test(colorHex)) {
    return NextResponse.json({ error: "Invalid colorHex" }, { status: 400 });
  }

  const existing = await prisma.workDiaryLabel.findFirst({
    where: { id, userId, archived: false },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ja mainām nosaukumu – pārbaudi unikālo
  if (name && name.toLowerCase() !== existing.name.toLowerCase()) {
    const clash = await prisma.workDiaryLabel.findFirst({
      where: { userId, name, archived: false },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json({ error: "Label name already exists" }, { status: 409 });
    }
  }

  const updated = await prisma.workDiaryLabel.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      colorHex: colorHex ?? existing.colorHex,
    },
  });

  return NextResponse.json(updated);
}
