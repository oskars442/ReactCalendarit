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

// GET /api/todo  -> list my tasks
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);

    const { searchParams } = new URL(req.url);
    const due = searchParams.get("due"); // YYYY-MM-DD (optional)

    const where: any = { userId };

    if (due) {
      // pārbaude
      if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) {
        return NextResponse.json({ error: "Bad 'due' format" }, { status: 400 });
      }
      // atlasām DIENAS intervālu (UTC), jo DB glabā Date ar laiku (pie tevis – UTC noon)
      const start = new Date(`${due}T00:00:00.000Z`);
      const end   = new Date(`${due}T23:59:59.999Z`);
      where.due = { gte: start, lte: end };
    }

    const items = await prisma.todoItem.findMany({
      where,
      orderBy: [{ done: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true, title: true, note: true, done: true, priority: true,
        due: true, createdAt: true, updatedAt: true,
      },
    });

    // send due back as "YYYY-MM-DD" (based on UTC)
    const data = items.map(i => ({
      ...i,
      id: String(i.id),
      due: i.due ? i.due.toISOString().slice(0, 10) : null,
    }));

    return NextResponse.json({ items: data });
  } catch (e: any) {
    if (e?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/todo error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/todo  -> create
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);

    const body = await req.json();
    const title = String(body?.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const data: any = {
      userId,
      title,
      note: body?.note ? String(body.note).trim() : null,
      priority: body?.priority ?? "med",
      done: !!body?.done,
    };

    // IMPORTANT: convert date-only to UTC noon (not local midnight)
    if (typeof body?.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.due)) {
      data.due = dateOnlyToUTCNoon(body.due);
    } else {
      data.due = null;
    }

    const created = await prisma.todoItem.create({
      data,
      select: {
        id: true, title: true, note: true, done: true, priority: true,
        due: true, createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({
      item: {
        ...created,
        id: String(created.id),
        due: created.due ? created.due.toISOString().slice(0, 10) : null,
      },
    }, { status: 201 });
  } catch (e: any) {
    if (e?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/todo error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
