// src/app/api/suggestions/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, isAdmin, HttpError } from "@/lib/auth-helpers";

/** Kešs OFF visam maršrutam */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const noStore = { "Cache-Control": "private, no-store, no-cache, must-revalidate" };

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
 * Ikviens (ar vai bez login) var iesniegt ieteikumu.
 */
export async function POST(req: Request) {
  try {
    // Honeypot (ja kādreiz pievienosi slēpto "website" lauku formā)
    const hp = req.headers.get("x-hp");
    if (hp) {
      return new NextResponse(JSON.stringify({ ok: true }), {
        status: 201,
        headers: noStore,
      });
    }

    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid payload", issues: parsed.error.format() }),
        { status: 400, headers: noStore }
      );
    }

    const session = await getSession();

    // IP (ja nākotnē vēlies likt rate-limit vai saglabāt)
    const ip =
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    const data = parsed.data;

    // ja anonīms – ignorē vārdu/e-pastu
    const effectiveName = data.isAnonymous ? null : data.name ?? null;
    const effectiveEmail = data.isAnonymous ? null : data.email ?? null;

    // userId: neatspied uz skaitli — atstāj kā string (drošāk ar uuid/cuid),
    // ja tavā shēmā tas ir Int, vari pārvērst ar parseInt.
    const rawId = session?.user?.id ?? null;
    const userId = rawId ? String(rawId) : null;

    const suggestion = await prisma.suggestion.create({
      data: {
        // ja tavā Prisma modelī userId ir Int:
        // userId: userId ? parseInt(userId, 10) : null,
        // pretējā gadījumā:
        // @ts-expect-error — atkarībā no tavas shēmas tipa
        userId,
        name: effectiveName,
        email: effectiveEmail,
        isAnonymous: data.isAnonymous,
        hidePublic: data.hidePublic,
        content: data.content,
        // ip
      },
      select: { id: true },
    });

    return new NextResponse(JSON.stringify({ ok: true, data: suggestion }), {
      status: 201,
      headers: noStore,
    });
  } catch (err) {
    console.error("POST /api/suggestions error:", err);
    if (err instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: err.message }), {
        status: err.status,
        headers: noStore,
      });
    }
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: noStore,
    });
  }
}

/**
 * GET /api/suggestions
 * Publisks saraksts: viesiem rāda tikai ne-slēptos; adminam (ja ielogots) rāda arī slēptos.
 * Atbalsta lapošanu ar ?cursor=<id>&limit=20
 */
const QuerySchema = z.object({
  cursor: z.string().optional(), // id kā string — der abiem (uuid/int), parseInt vari iekšā, ja vajag
  limit: z
    .string()
    .transform(v => Number.parseInt(v, 10))
    .refine(n => Number.isFinite(n) && n > 0 && n <= 100, "limit must be 1..100")
    .optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = QuerySchema.safeParse({
      cursor: url.searchParams.get("cursor") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    });
    const limit = q.success ? q.data.limit ?? 30 : 30;

    const session = await getSession();
    const admin = !!session && isAdmin(session);

    // Filtrs viesiem: nerāda hidePublic; adminam rāda visu (ne-archived)
    const where = admin ? { archived: false } : { archived: false, hidePublic: false };

    // Pinned vispirms, pēc tam jaunākie
    const orderBy = [{ pinned: "desc" as const }, { createdAt: "desc" as const }];

    // Cursor lapošana — ja id ir Int, pārforsē to zemāk
    const cursorId = q.success && q.data.cursor ? q.data.cursor : undefined;

    const items = await prisma.suggestion.findMany({
      where,
      orderBy,
      take: limit,
      ...(cursorId
        ? {
            cursor: { id: isFinite(Number(cursorId)) ? (Number(cursorId) as any) : (cursorId as any) },
            skip: 1,
          }
        : {}),
      // Drošības nolūkos vari selectēt tikai vajadzīgos laukus
      // select: { id: true, content: true, createdAt: true, pinned: true, ... }
    });

    // Nosaki nākamo kursora vērtību
    const nextCursor = items.length === limit ? String(items[items.length - 1].id) : null;

    return new NextResponse(JSON.stringify({ ok: true, data: items, nextCursor }), {
      status: 200,
      headers: noStore,
    });
  } catch (err) {
    console.error("GET /api/suggestions error:", err);
    if (err instanceof HttpError) {
      return new NextResponse(JSON.stringify({ error: err.message }), {
        status: err.status,
        headers: noStore,
      });
    }
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: noStore,
    });
  }
}
