// src/app/api/groceries/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { GroceryListKind } from "@prisma/client";

function requireUserId(session: any): number {
  const id = Number((session?.user as any)?.id);
  if (!id) throw new Error("UNAUTH");
  return id;
}

const ALLOWED_LISTS: ReadonlySet<GroceryListKind> = new Set(["daily", "longterm"]);
function normalizeList(input?: unknown): GroceryListKind | undefined {
  if (typeof input !== "string") return undefined;
  const v = input.toLowerCase() as GroceryListKind;
  return ALLOWED_LISTS.has(v) ? v : undefined;
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);

    const id = parseId(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json().catch(() => ({} as any));
    const updates: Partial<{
      text: string;
      completed: boolean;
      list: GroceryListKind;
    }> = {};

    if (typeof body.text === "string") {
      const t = body.text.trim();
      if (!t) return NextResponse.json({ error: "Text cannot be empty" }, { status: 400 });
      updates.text = t;
    }

    if (typeof body.completed === "boolean") {
      updates.completed = body.completed;
    }

    const maybeList = normalizeList(body.list);
    if (maybeList) updates.list = maybeList;

    if (!("text" in updates) && !("completed" in updates) && !("list" in updates)) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // updateMany -> droši ar userId īpašumtiesībām (update nevar ar ne-unique where)
    const { count } = await prisma.groceryItem.updateMany({
      where: { id, userId },
      data: updates,
    });

    if (count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const item = await prisma.groceryItem.findUnique({
      where: { id },
      select: { id: true, text: true, completed: true, createdAt: true, list: true },
    });

    return NextResponse.json({ item });
  } catch (e: any) {
    if (e?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);

    const id = parseId(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { count } = await prisma.groceryItem.deleteMany({
      where: { id, userId },
    });

    if (count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
