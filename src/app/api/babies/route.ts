// app/api/babies/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔧 Baby.userId = Int → konvertējam uz skaitli
  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid session user id" }, { status: 400 });
  }

  const babies = await prisma.baby.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, birth: true },
  });

  return NextResponse.json({ babies });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id); // 🔧 konvertācija
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid session user id" }, { status: 400 });
  }

  const body = await req.json();
  const name = (body?.name ?? "").trim();
  const birth = body?.birth ? new Date(body.birth) : null;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const baby = await prisma.baby.create({
    data: { name, birth: birth ?? undefined, userId },
    select: { id: true, name: true, birth: true },
  });

  return NextResponse.json({ baby }, { status: 201 });
}
