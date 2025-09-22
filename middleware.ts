// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** Configure your locales */
const locales = ["en", "lv"] as const;
const defaultLocale: (typeof locales)[number] = "en";

/** Utility: does path start with /{locale}/ ? */
function pathHasLocale(pathname: string) {
  const seg = pathname.split("/")[1];
  return locales.includes(seg as any);
}

/** Which paths should skip middleware entirely */
function isBypassedPath(pathname: string) {
  // static files, next internals, images, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|avif|txt|xml|js|css)$/)
  )
    return true;

  // APIs (let your route handlers do auth)
  if (pathname.startsWith("/api")) return true;

  return false;
}

/** Your existing code */
function sessionCookieName(req: NextRequest) {
  return req.cookies.has("__Secure-next-auth.session-token")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // 0) Bypass for assets & API
  if (isBypassedPath(pathname)) return NextResponse.next();

  // 1) Locale prefix enforcement (redirect / → /{defaultLocale}, and
  //    also /foo → /{defaultLocale}/foo if it lacks a locale prefix)
  if (!pathHasLocale(pathname)) {
    const redirectURL = new URL(
      `/${defaultLocale}${pathname.endsWith("/") ? pathname : pathname}`,
      origin
    );
    // handle query string as well
    redirectURL.search = req.nextUrl.search;
    return NextResponse.redirect(redirectURL);
  }

  // 2) Auth (your logic; leave paths like /{locale}/login public)
  //    Adjust this list to match your public routes.
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];
  const rest = `/${segments.slice(1).join("/")}`;

  const isPublic =
    rest === "/login" ||
    rest === "/register" ||
    rest.startsWith("/auth/") ||
    rest.startsWith("/public/");

  if (!isPublic) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      // redirect unauthenticated users to /{locale}/login
      const loginURL = new URL(`/${locale}/login`, origin);
      loginURL.searchParams.set("from", pathname);
      return NextResponse.redirect(loginURL);
    }

    // 3) “Remember me” → downgrade to session cookie if user didn’t opt-in
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
          // No expires/maxAge → session cookie
        });
        return res;
      }
    }
  }

  return NextResponse.next();
}

/**
 * Match everything EXCEPT:
 *  - static files (has a dot), _next, favicon
 *  - we still want / and all locale-prefixed routes to be handled
 */
export const config = {
  matcher: [
    // run on all paths
    "/((?!_next|.*\\..*|favicon.ico).*)",
  ],
};
