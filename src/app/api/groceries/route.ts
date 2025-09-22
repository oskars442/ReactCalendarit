// src/app/api/groceries/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function requireUserId(session: any): number {
  const id = Number((session?.user as any)?.id);
  if (!id) throw new Error("UNAUTH");
  return id;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);

    const items = await prisma.groceryItem.findMany({
      where: { userId },
      select: { id: true, text: true, completed: true, createdAt: true },
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);

    const { text } = await req.json();
    const t = String(text ?? "").trim();
    if (!t) return NextResponse.json({ error: "Text required" }, { status: 400 });

    const created = await prisma.groceryItem.create({
      data: { userId, text: t },
      select: { id: true, text: true, completed: true, createdAt: true },
    });

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (e: any) {
    if (e?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
