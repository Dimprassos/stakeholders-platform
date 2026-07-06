import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session";

const LOGIN_PATH = "/admin/login";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isLogin = path === LOGIN_PATH;

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decodeSession(token);
  const isAuthed = !!session && session.role === "ADMIN";

  // Already-authed admin visiting /admin/login → send to dashboard.
  if (isLogin && isAuthed) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  // Unauthenticated access to any other /admin/* → send to login.
  if (!isLogin && !isAuthed) {
    const url = req.nextUrl;
    url.pathname = LOGIN_PATH;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};