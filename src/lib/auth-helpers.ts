// src/lib/auth-helpers.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/** HTTP kļūda ar statusu */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

/** No-cache konstantes (ērtībai importē API/lapās) */
export const NoStore = {
  dynamic: "force-dynamic" as const,
  revalidate: 0 as const,
  fetchCache: "force-no-store" as const,
  headers: { "Cache-Control": "private, no-store, no-cache, must-revalidate" } as const,
};

/** Viegls JSON atbildes helpers ar atbilstošu cache kontroli */
export function json<T>(data: T, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...NoStore.headers,
      ...(init?.headers || {}),
    },
  });
}

/** Iegūst sesiju (var būt null) */
export async function getSession() {
  return getServerSession(authOptions);
}

/** Iegūst sesiju vai met 401 */
export async function requireSession(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new HttpError(401, "Unauthorized");
  return session;
}

/** Pārbauda, vai lietotājs ir admins (pēc role vai e-pasta listes) */
export function isAdmin(session: Session | null) {
  const email = session?.user?.email?.toLowerCase();
  const role = (session?.user as any)?.role;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return role === "ADMIN" || (!!email && admins.includes(email));
}

/** Met 403, ja nav admin */
export function requireAdmin(session: Session) {
  if (!isAdmin(session)) throw new HttpError(403, "Forbidden");
}

/**
 * Atgriež lietotāja ID.
 * - pēc noklusējuma atgriež kā string (drošāk ar Prisma UUID/CUID).
 * - ja numeric:true → mēģina parseInt; ja nav skaitlis, met 400.
 */
export async function requireUserId(opts?: { numeric?: boolean }): Promise<string | number> {
  const session = await requireSession();
  const id = session.user?.id;
  if (!id) throw new HttpError(401, "Unauthorized");

  if (opts?.numeric) {
    const n = Number.parseInt(String(id), 10);
    if (!Number.isFinite(n)) throw new HttpError(400, "Invalid session id (expected number)");
    return n;
  }
  return String(id);
}

/**
 * API route ietvarfunkcija: izmanto `await withApiAuth(req, async (user) => {...})`
 * automātiski noķer HttpError un atgriež korektu JSON + statusu.
 */
export async function withApiAuth<T>(
  handler: (ctx: { userId: string; session: Session }) => Promise<T>
) {
  try {
    const session = await requireSession();
    const userId = String(session.user!.id);
    const data = await handler({ userId, session });
    return json(data);
  } catch (e: any) {
    if (e instanceof HttpError) {
      return json({ error: e.message }, { status: e.status });
    }
    console.error("API error:", e);
    return json({ error: "Server error" }, { status: 500 });
  }
}
