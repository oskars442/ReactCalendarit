// src/app/api/suggestions/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, isAdmin, HttpError } from "@/lib/auth-helpers";

const UpdateSchema = z.object({
  status: z.enum(["NEW", "PLANNED", "IN_PROGRESS", "DONE", "REJECTED"]).optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
  hidePublic: z.boolean().optional(),
});

/**
 * PATCH /api/suggestions/:id
 * Tikai admin drīkst rediģēt ieteikumus
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!isAdmin(session)) {
      throw new HttpError(403, "Forbidden");
    }

    const id = Number.parseInt(params.id, 10);
    if (!Number.isFinite(id)) {
      throw new HttpError(400, "Invalid id");
    }

    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.format() }, { status: 400 });
    }

    const updated = await prisma.suggestion.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("PATCH /api/suggestions/[id] error:", err);
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/suggestions/:id
 * Tikai admin drīkst arhivēt (soft delete)
 */
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!isAdmin(session)) {
      throw new HttpError(403, "Forbidden");
    }

    const id = Number.parseInt(params.id, 10);
    if (!Number.isFinite(id)) {
      throw new HttpError(400, "Invalid id");
    }

    await prisma.suggestion.update({
      where: { id },
      data: { archived: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/suggestions/[id] error:", err);
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
