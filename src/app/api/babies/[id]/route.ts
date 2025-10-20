// app/api/babies/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Baby.userId ir Int → konvertējam
  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid session user id" }, { status: 400 });
  }

  const body = await req.json();

  // Atbalstām: name (string), birth (ISO string vai null, lai notīrītu)
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const birth =
    body?.birth === null
      ? null
      : body?.birth
      ? new Date(body.birth)
      : undefined; // undefined = nelabojam lauku

  const updated = await prisma.baby.updateMany({
    where: { id: params.id, userId },
    data: { ...(name !== undefined && { name }), ...(birth !== undefined && { birth }) },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ updated: updated.count }, { status: 200 });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid session user id" }, { status: 400 });
  }

  // Dzēšam tikai lietotāja bērnu
  const deleted = await prisma.baby.deleteMany({
    where: { id: params.id, userId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 204 = veiksmīgi, bez satura
  return new NextResponse(null, { status: 204 });
}
