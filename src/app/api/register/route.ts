// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, gender, birthdate, country } = await req.json();
    const e = (email ?? "").toLowerCase().trim();
    const p = (password ?? "").trim();
    if (!e || !p) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: e } });
    if (exists) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(p);

    // Normalize birthdate -> Date or null
    let birth: Date | null = null;
    if (birthdate && /^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      birth = new Date(`${birthdate}T00:00:00.000Z`);
    }

    const user = await prisma.user.create({
      data: {
        email: e,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        gender: gender || null,
        birthdate: birth,
        country: country || null,
        // role defaults to "user" in DB
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
