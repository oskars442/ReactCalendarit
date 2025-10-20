// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** Locales */
const locales = ["lv", "en"] as const;
const defaultLocale: (typeof locales)[number] = "lv";

/** Aizsargātie lapu prefiksi (vajag login) */
const protectedPrefixes = [
  "dashboard",
  "calendar",
  "work",         // ja ir lapa ar šo prefiksu
  "work-diary",   // <-- pievienots: tava WorkDiary lapa
  "tasks",
  "projects",
  "profile",
  "statistics",
  "groceries",
  "trainings",
  "settings",
];

/** Aizsargātie API maršruti (bez locale; jāatgriež 401 JSON, nevis redirect) */
const protectedApiPaths = [
  "/api/work",           // GET/POST/PATCH/DELETE uz darba dienasgrāmatu
  "/api/work/",          // arī apakšceļi, piem., /api/work/labels
];

/** Vai ceļš sākas ar kādu no norādītajiem prefiksiem */
function startsWithAny(pathname: string, list: string[]) {
  return list.some(p => pathname.startsWith(p));
}

/** Vai ceļš jau sākas ar /{locale}/ */
function pathHasLocale(pathname: string) {
  const seg = pathname.split("/")[1];
  return locales.includes(seg as any);
}

/** Izlaižam statiskos resursus u.tml. (ne-API) */
function isStaticBypass(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.(ico|png|jpg|jpeg|gif|svg|webp|avif|txt|xml|js|css|map)$/.test(pathname)
  );
}

/** NextAuth sesijas cookie vārds (prod vs dev) */
function sessionCookieName(req: NextRequest) {
  return req.cookies.has("__Secure-next-auth.session-token")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

/** Vai dotais (locale-atsists) ceļš ir publisks */
function isPublicRest(rest: string) {
  // Public lapas (pielāgo pēc vajadzības)
  if (
    rest === "/" ||
    rest === "/login" ||
    rest === "/register" ||
    rest.startsWith("/auth/") ||
    rest.startsWith("/public/") ||
    rest.startsWith("/about") ||
    rest.startsWith("/pricing") ||
    rest.startsWith("/terms") ||
    rest.startsWith("/privacy")
  ) return true;

  // Ja nesākas ar nevienu no aizsargātajiem prefiksiem — publisks
  return !protectedPrefixes.some(p =>
    new RegExp(`^/${p}(?:/|$)`, "i").test(rest)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;

  // ─────────────────────────────────────────────────────
  // 0) Aizsargātie API maršruti (bez locale; nav redirect, bet 401 JSON)
  // ─────────────────────────────────────────────────────
  if (pathname.startsWith("/api")) {
    if (startsWithAny(pathname, protectedApiPaths)) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    // API nekad neliekam locale prefiksu un neļaujam redirectiem traucēt
    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────
  // 1) Bypass statikai/Next iekšām
  // ─────────────────────────────────────────────────────
  if (isStaticBypass(pathname)) return NextResponse.next();

  // ─────────────────────────────────────────────────────
  // 2) Piespiežam locale prefiksu lapām (ne-API)
  // ─────────────────────────────────────────────────────
  if (!pathHasLocale(pathname)) {
    const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const redirectURL = new URL(`/${defaultLocale}${clean}`, origin);
    redirectURL.search = search; // saglabā query
    return NextResponse.redirect(redirectURL);
  }

  // ─────────────────────────────────────────────────────
  // 3) Izgriežam locale un vajadzības gadījumā prasa auth (lapām)
  // ─────────────────────────────────────────────────────
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] as typeof locales[number];
  const rest = `/${segments.slice(1).join("/")}` || "/";

  if (!isPublicRest(rest)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      // Nav ielogojies → uz /{locale}/login ar redirect parametru
      const loginURL = new URL(`/${locale}/login`, origin);
      loginURL.searchParams.set("from", pathname + search);
      return NextResponse.redirect(loginURL);
    }

    // “Remember me” nav ieslēgts → padarām par session cookie
    const remember = req.cookies.get("remember_me")?.value === "1";
    if (!remember) {
      const name = sessionCookieName(req);
      const val = req.cookies.get(name)?.value;
      if (val) {
        const res = NextResponse.next();
        res.cookies.set({
          name,
          value: val,
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
          // bez expires/maxAge → session cookie
        });
        return res;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*|favicon.ico).*)"],
};
