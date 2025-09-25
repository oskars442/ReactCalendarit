// src/lib/auth-helpers.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireUserId() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id;
  if (!id) {
    // ja nav autentificēts – 401
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return Number(id);
}
