// src/app/api/groceries/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client"; 
import type { GroceryListKind } from "@prisma/client";

function requireUserId(session: any): number {
  const id = Number((session?.user as any)?.id);
  if (!id) throw new Error("UNAUTH");
  return id;
}

const ALLOWED_LISTS = new Set<GroceryListKind>(["daily", "longterm"]);


function normalizeList(input?: string | null): GroceryListKind {
  const v = String(input ?? "").toLowerCase() as GroceryListKind;
  return ALLOWED_LISTS.has(v) ? v : "daily";
}

// GET /api/groceries?list=daily|longterm
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);

    const { searchParams } = new URL(req.url);
    const list = normalizeList(searchParams.get("list"));

    const items = await prisma.groceryItem.findMany({
      where: { userId, list },
      select: { id: true, text: true, completed: true, createdAt: true, list: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    if (e?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST body: { text: string, list?: 'daily'|'longterm' }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);

    const body = await req.json().catch(() => ({}));
    const t = String(body?.text ?? "").trim();
    if (!t) return NextResponse.json({ error: "Text required" }, { status: 400 });

    const list = normalizeList(body?.list); // 👈 enum vērtība

    const created = await prisma.groceryItem.create({
      data: { userId, text: t, list }, // 👈 vairs nav TS kļūda, jo tips atbilst enum laukam
      select: { id: true, text: true, completed: true, createdAt: true, list: true },
    });

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (e: any) {
    if (e?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
