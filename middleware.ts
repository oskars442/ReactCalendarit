// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** Locales */
const locales = ["lv", "en"] as const;
const defaultLocale: (typeof locales)[number] = "lv";

/** Protected sadaļu prefiksi (vajag login) */
const protectedPrefixes = [
  "dashboard",
  "calendar",
  "work",          // darba dienasgrāmata, ja tev tāds ceļš
  "tasks",
  "projects",
  "profile",
  "statistics",
  "groceries",
  "trainings",
  "settings",
];

/** Vai ceļš jau sākas ar /{locale}/  */
function pathHasLocale(pathname: string) {
  const seg = pathname.split("/")[1];
  return locales.includes(seg as any);
}

/** Izlaižam statiskos resursus, next iekšas u.tml. */
function isBypassedPath(pathname: string) {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|avif|txt|xml|js|css|map)$/)
  ) return true;

  // API – lai paši route handlers veic auth (ieteicams!)
  if (pathname.startsWith("/api")) return true;

  return false;
}

/** NextAuth sesijas cookie vārds (prod vs dev) */
function sessionCookieName(req: NextRequest) {
  return req.cookies.has("__Secure-next-auth.session-token")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

/** Vai dotais (locale-atsists) ceļš ir publisks */
function isPublicRest(rest: string) {
  // Public lapas (pielāgo kā vajag)
  if (
    rest === "/" ||
    rest === "/login" ||
    rest === "/register" ||
    rest.startsWith("/auth/") ||     // NextAuth pages
    rest.startsWith("/public/") ||
    rest.startsWith("/about") ||
    rest.startsWith("/pricing") ||
    rest.startsWith("/terms") ||
    rest.startsWith("/privacy")
  ) return true;

  // Ja nav neviena no protected prefiksiem — uzskatām par publisku
  return !protectedPrefixes.some(p =>
    new RegExp(`^/${p}(?:/|$)`, "i").test(rest)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname, origin, search } = req.nextUrl;

  // 0) Bypass
  if (isBypassedPath(pathname)) return NextResponse.next();

  // 1) Piespiežam locale prefiksu
  if (!pathHasLocale(pathname)) {
    const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const redirectURL = new URL(`/${defaultLocale}${clean}`, origin);
    redirectURL.search = search; // saglabā query
    return NextResponse.redirect(redirectURL);
  }

  // 2) Izgriežam locale un nosakām, vai vajag auth
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

    // 3) “Remember me” nav ieslēgts → sesijas cookies (bez maxAge)
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
