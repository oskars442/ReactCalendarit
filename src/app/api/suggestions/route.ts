// src/app/api/suggestions/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, isAdmin, HttpError } from "@/lib/auth-helpers";

const CreateSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().email().max(200).optional(),
  isAnonymous: z.boolean().optional().default(false),
  hidePublic: z.boolean().optional().default(false),
  content: z
    .string()
    .trim()
    .min(10, "Ieteikumam jābūt vismaz 10 simboli")
    .max(2000, "Ieteikums ir par garu (max. 2000 simboli)"),
});

/**
 * POST /api/suggestions
 * Ikviens (ar vai bez login) var iesniegt ieteikumu
 */
export async function POST(req: Request) {
  try {
    // Honeypot (ja kādreiz pievienosi slēpto "website" lauku formā)
    const hp = req.headers.get("x-hp");
    if (hp) {
      // klusais "OK", lai botiem nav signāla, ka viņi atklāti
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.format() },
        { status: 400 }
      );
    }

    const session = await getSession();
    const ip =
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    const data = parsed.data;

    // ja lietotājs ir anonīms, ignorē vārdu/e-pastu
    const effectiveName = data.isAnonymous ? null : data.name ?? null;
    const effectiveEmail = data.isAnonymous ? null : data.email ?? null;

    // konvertē userId droši, ja tas ir skaitlis DB
    const userId =
      session?.user?.id && Number.isFinite(Number.parseInt(session.user.id, 10))
        ? Number.parseInt(session.user.id, 10)
        : null;

    const suggestion = await prisma.suggestion.create({
      data: {
        userId,
        name: effectiveName,
        email: effectiveEmail,
        isAnonymous: data.isAnonymous,
        hidePublic: data.hidePublic,
        content: data.content,
        // ip — ja pievienosi kolonu, varēsi te saglabāt
        // ip,
      },
    });

    return NextResponse.json(
      { ok: true, data: { id: suggestion.id } },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/suggestions error:", err);
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/suggestions
 * Tikai ielogotie drīkst skatīt sarakstu.
 * Admin redz visus; pārējie neredz `hidePublic: true`.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) throw new HttpError(401, "Unauthorized");

    const admin = isAdmin(session);

    const items = await prisma.suggestion.findMany({
      where: admin
        ? { archived: false }
        : { archived: false, hidePublic: false },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ ok: true, data: items });
  } catch (err) {
    console.error("GET /api/suggestions error:", err);
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
