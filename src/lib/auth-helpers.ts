// src/lib/auth-helpers.ts
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Kļūda ar HTTP statusu */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message);
    this.status = status;
  }
}

/** Ērti paņemt sesiju (vai null, ja nav) */
export async function getSession() {
  return getServerSession(authOptions);
}

/** Pārbauda, vai lietotājs ir admins */
export function isAdmin(session: Session | null) {
  const email = session?.user?.email?.toLowerCase();
  const role = (session?.user as any)?.role;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  return role === "ADMIN" || (!!email && admins.includes(email));
}

/**
 * Prasa ielogotu lietotāju un atgriež viņa ID.
 * - ja nav ielogots → 401
 * - ja ID nederīgs (nav number, ja sagaidām skaitli) → 400
 */
export async function requireUserId(asNumber = true): Promise<number | string> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;

  if (!id) {
    throw new HttpError(401, "Unauthorized");
  }

  if (asNumber) {
    const n = Number.parseInt(id, 10);
    if (!Number.isFinite(n)) {
      throw new HttpError(400, "Invalid session id");
    }
    return n;
  }

  return id;
}
