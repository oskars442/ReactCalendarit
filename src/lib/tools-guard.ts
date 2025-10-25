// src/lib/tools-guard.ts
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";

export type ToolKey =
  | "calendar" | "diary" | "tasks" | "workouts" | "shopping"
  | "weather" | "baby" | "stats" | "projects";

export async function ensureToolEnabled(tool: ToolKey) {
  const userId = await requireUserId();
  const s = await prisma.userToolSettings.findUnique({ where: { userId } });
  if (!s || !s[tool]) return false;
  return true;
}
