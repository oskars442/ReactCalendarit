// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

/** ───── Helpers ───── */
function normalizeEmail(e: string) {
  return e.trim().toLowerCase();
}

function parseBirthdate(input?: string | null): Date | null {
  if (!input) return null;
  // atļaujam tikai ISO datumu (YYYY-MM-DD) – droši un viennozīmīgi
  const m = String(input).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  // fiksējam kā UTC pusnakti, lai nav TZ nobīdes
  return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`);
}

/** ───── Validācija ───── */
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  firstName: z.string().trim().min(1).max(100).optional().or(z.literal("").transform(() => undefined)),
  lastName: z.string().trim().min(1).max(100).optional().or(z.literal("").transform(() => undefined)),
  gender: z.string().trim().max(30).optional().or(z.literal("").transform(() => undefined)),
  birthdate: z.string().optional(), // YYYY-MM-DD
  country: z.string().trim().max(100).optional().or(z.literal("").transform(() => undefined)),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, gender, birthdate, country } = parsed.data;

    const e = normalizeEmail(email);
    const passwordHash = await hashPassword(password);
    const birth = parseBirthdate(birthdate);

    // Viena transakcija: user + tool settings
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: e,
          passwordHash,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          gender: gender ?? null,
          birthdate: birth,
          country: country ?? null,
          // role -> default "user" DB pusē
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });

      // izveido pamata iestatījumus (ja mainīsi defaultus – dari DB modelī)
      await tx.userToolSettings.create({
        data: { userId: user.id },
      });

      return user;
    });

    return NextResponse.json({ user: result }, { status: 201 });
  } catch (err: any) {
    // Prisma unique constraint
    if (err?.code === "P2002" && err?.meta?.target?.includes("email")) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
