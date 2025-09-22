import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function requireUserId(session: Awaited<ReturnType<typeof getServerSession>>) {
  const id = (session as any)?.user?.id;
  if (!id) throw new Error("UNAUTH");
  return Number(id);
}

// helper: "YYYY-MM-DD" -> Date at 12:00:00 UTC (TZ-safe)
function dateOnlyToUTCNoon(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const data: any = {};

    if (typeof body.title === "string")  data.title = body.title.trim();
    if (typeof body.note === "string")   data.note = body.note.trim() || null;
    if (typeof body.done === "boolean")  data.done = body.done;
    if (typeof body.priority === "string") data.priority = body.priority;

    if (typeof body.due === "string" || body.due === null) {
      data.due =
        body.due && /^\d{4}-\d{2}-\d{2}$/.test(body.due)
          ? dateOnlyToUTCNoon(body.due)
          : null;
    }

    const { count } = await prisma.todoItem.updateMany({
      where: { id, userId },
      data,
    });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const item = await prisma.todoItem.findUnique({
      where: { id },
      select: {
        id: true, title: true, note: true, done: true, priority: true,
        due: true, createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({
      item: item
        ? { ...item, id: String(item.id), due: item.due ? item.due.toISOString().slice(0, 10) : null }
        : null,
    });
  } catch (e: any) {
    if (e?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/todo/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { count } = await prisma.todoItem.deleteMany({ where: { id, userId } });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/todo/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
