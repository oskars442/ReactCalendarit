// src/types/next-auth.d.ts  Make TS aware of session.user.role and id:
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string | null;
      role: "USER" | "ADMIN";
    } & DefaultSession["user"];
  }
  interface User {
    role?: "USER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "ADMIN";
  }
}
