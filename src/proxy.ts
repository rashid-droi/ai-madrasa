// Optimistic route guard: reads only the signed cookie (no database).
// Real authorization happens in src/lib/auth.ts on every page and action.
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";
import { ROLE_HOME, roleForPath } from "@/lib/roles";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
    return NextResponse.next();
  }

  const required = roleForPath(pathname);
  if (required) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    if (session.role !== required) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
