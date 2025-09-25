// src/app/api/work/labels/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";

/**
 * DELETE /api/work/labels/:id
 * Soft-delete: archived = true
 */
export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Piederība + nav jau arhivēta
    const existing = await prisma.workDiaryLabel.findFirst({
      where: { id, userId, archived: false },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.workDiaryLabel.update({
      where: { id },
      data: { archived: true },
    });

    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return NextResponse.json({ error: "Failed to delete label." }, { status });
  }
}

/**
 * PATCH /api/work/labels/:id
 * Maina nosaukumu/krāsu. Nodrošina unikālu nosaukumu (case-insensitive) starp ne-arhivētajām etiķetēm.
 */
export async function PATCH(
  req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    const nextNameRaw = typeof body?.name === "string" ? body.name : undefined;
    const nextColorRaw = typeof body?.colorHex === "string" ? body.colorHex : undefined;

    const name = nextNameRaw?.trim();
    const colorHex = nextColorRaw?.trim()?.toLowerCase();

    if (colorHex && !/^#([0-9a-f]{6})$/.test(colorHex)) {
      return NextResponse.json({ error: "Invalid colorHex" }, { status: 400 });
    }

    // Pārliecināmies, ka etiķete pieder lietotājam un nav arhivēta
    const existing = await prisma.workDiaryLabel.findFirst({
      where: { id, userId, archived: false },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Ja mainām nosaukumu → pārbaudām konfliktu ar citu NE-arhivētu etiķeti (case-insensitive)
    if (name && name.toLowerCase() !== existing.name.toLowerCase()) {
      const clash = await prisma.workDiaryLabel.findFirst({
        where: {
          userId,
          archived: false,
          name: { equals: name, mode: "insensitive" },
          NOT: { id }, // nepašai
        },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json(
          { error: "Label name already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.workDiaryLabel.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(colorHex ? { colorHex } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return NextResponse.json({ error: "Failed to update label." }, { status });
  }
}
