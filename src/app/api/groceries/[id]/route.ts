// src/app/api/groceries/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function requireUserId(session: any): number {
  const id = Number((session?.user as any)?.id);
  if (!id) throw new Error("UNAUTH");
  return id;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = requireUserId(session);

    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const data: Record<string, any> = {};
    if (typeof body.text === "string") data.text = body.text.trim();
    if (typeof body.completed === "boolean") data.completed = body.completed;

    const { count } = await prisma.groceryItem.updateMany({
      where: { id, userId },
      data,
    });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const item = await prisma.groceryItem.findUnique({
      where: { id },
      select: { id: true, text: true, completed: true, createdAt: true },
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

    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { count } = await prisma.groceryItem.deleteMany({ where: { id, userId } });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.message === "UNAUTH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
