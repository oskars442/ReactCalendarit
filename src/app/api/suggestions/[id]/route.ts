// src/app/api/suggestions/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, isAdmin, HttpError } from "@/lib/auth-helpers";

// Kešošana OFF šim maršrutam
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = { "Cache-Control": "private, no-store, no-cache, must-revalidate" };

const IdSchema = z.object({
  id: z
    .string()
    .refine(v => /^\d+$/.test(v), "Invalid id"), // 👈 ja tev kādreiz būs UUID, pielāgo
});

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
    if (!isAdmin(session)) throw new HttpError(403, "Forbidden");

    const pid = IdSchema.safeParse(params);
    if (!pid.success) {
      return new NextResponse(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
        headers: noStore,
      });
    }
    const id = parseInt(pid.data.id, 10);

    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid payload", issues: parsed.error.format() }),
        { status: 400, headers: noStore }
      );
    }

    const updated = await prisma.suggestion.update({
      where: { id },
      data: parsed.data,
    });

    return new NextResponse(JSON.stringify({ ok: true, data: updated }), {
      status: 200,
      headers: noStore,
    });
  } catch (err: any) {
    console.error("PATCH /api/suggestions/[id] error:", err);

    // Prisma notFound -> 404
    if (err?.code === "P2025") {
      return new NextResponse(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: noStore,
      });
    }
    if (err instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: err.message }), {
        status: err.status,
        headers: noStore,
      });
    }
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: noStore,
    });
  }
}

/**
 * DELETE /api/suggestions/:id
 * Tikai admin drīkst arhivēt (soft delete)
 */
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!isAdmin(session)) throw new HttpError(403, "Forbidden");

    const pid = IdSchema.safeParse(params);
    if (!pid.success) {
      return new NextResponse(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
        headers: noStore,
      });
    }
    const id = parseInt(pid.data.id, 10);

    const res = await prisma.suggestion.update({
      where: { id },
      data: { archived: true },
    });

    return new NextResponse(JSON.stringify({ ok: true, data: { id: res.id } }), {
      status: 200,
      headers: noStore,
    });
  } catch (err: any) {
    console.error("DELETE /api/suggestions/[id] error:", err);

    if (err?.code === "P2025") {
      return new NextResponse(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: noStore,
      });
    }
    if (err instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: err.message }), {
        status: err.status,
        headers: noStore,
      });
    }
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: noStore,
    });
  }
}
