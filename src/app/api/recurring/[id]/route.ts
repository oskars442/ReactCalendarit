// src/app/api/recurring/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RecurringEventSchema } from "@/lib/zodSchemas";

function parseISO(d: string) {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const session = await getServerSession(authOptions);
    const userId =
      session?.user && (session.user as any).id
        ? Number((session.user as any).id)
        : null;

    const body = await req.json();
    const parsed = RecurringEventSchema.partial().parse(body);

    const data: any = {};
    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.baseDate !== undefined) data.baseDate = parseISO(parsed.baseDate);
    if (parsed.recurrence !== undefined) data.recurrence = parsed.recurrence;
    if (parsed.notes !== undefined) data.notes = parsed.notes ?? null;
    if (parsed.skips !== undefined) data.skips = parsed.skips.map(parseISO);
    if (parsed.overrides !== undefined) data.overrides = parsed.overrides;

    const updated = await prisma.recurringEvent.update({
      where: { id, ...(userId ? { userId } : { userId: null }) },
      data,
    });

    return NextResponse.json({ ok: true, recurring: updated });
  } catch (err) {
    console.error("PATCH /api/recurring/:id failed:", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const session = await getServerSession(authOptions);
    const userId =
      session?.user && (session.user as any).id
        ? Number((session.user as any).id)
        : null;

    await prisma.recurringEvent.delete({
      where: { id, ...(userId ? { userId } : { userId: null }) },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/recurring/:id failed:", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
