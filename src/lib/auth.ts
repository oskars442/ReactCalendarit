import Credentials from "next-auth/providers/credentials";
import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { verifyPassword } from "./password";
import { prisma } from "@/lib/db";

export type AppRole = "USER" | "ADMIN";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = (creds?.email ?? "").toLowerCase().trim();
        const pass = creds?.password ?? "";
        if (!email || !pass) return null;

        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser?.passwordHash) {
          const ok = await verifyPassword(pass, dbUser.passwordHash);
          if (!ok) return null;

          return {
            id: String(dbUser.id),                        // 👈 ensure we return id
            email: dbUser.email,
            name: [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") || dbUser.email,
            role: (dbUser.role?.toUpperCase() as AppRole) || "USER",
          } as any as NextAuthUser;
        }

        // optional ENV admin fallback (dev only)
        const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
        const adminPlain = (process.env.ADMIN_PASSWORD ?? "").trim();
        if (adminEmail && email === adminEmail && adminPlain && pass === adminPlain) {
          return { id: "0", email: adminEmail, name: "Admin", role: "ADMIN" as AppRole } as any as NextAuthUser;
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: (NextAuthUser & { role?: AppRole }) | null }) {
      if (user) {
        (token as any).role = user.role ?? ("USER" as AppRole);
        (token as any).id = (user as any).id;            // 👈 add id to token
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      (session.user as any).role = ((token as any).role as AppRole) ?? "USER";
      (session.user as any).id = (token as any).id ?? null;  // 👈 expose id in session
      return session;
    },
  },

  pages: { signIn: "/login" },
};
