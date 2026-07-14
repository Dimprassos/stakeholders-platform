import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/magic-token";
import {
  SPONSOR_SESSION_COOKIE,
  encodeSponsorSession,
  sponsorSessionMaxAgeSeconds,
} from "@/lib/sponsor-session";

// Magic-link → session exchange (QA P0-2). A valid portal token is swapped for
// an httpOnly session cookie and the visitor is sent to the tokenless /portal,
// so the standing portal URL never carries a bearer token that could be copied,
// forwarded, bookmarked or leaked via Referer. Reached when an accepted sponsor
// opens their `/invite/{token}` link (e.g. from a payment or contract email).

const PORTAL_STATUSES = ["ACCEPTED", "DETAILS_SUBMITTED", "CONFIRMED"];

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const sponsor = token
    ? await prisma.sponsor.findUnique({
        where: { magicToken: token },
        select: { id: true, status: true, tokenExpiresAt: true },
      })
    : null;

  // Invalid/expired, or not yet accepted → hand back to the invite page, which
  // shows the proposal (to accept) or a clear "no longer valid" message.
  if (
    !sponsor ||
    isTokenExpired(sponsor.tokenExpiresAt) ||
    !PORTAL_STATUSES.includes(sponsor.status)
  ) {
    return NextResponse.redirect(new URL(`/invite/${token}`, req.url));
  }

  const jwt = await encodeSponsorSession({ sponsorId: sponsor.id });
  const res = NextResponse.redirect(new URL("/portal", req.url));
  res.cookies.set(SPONSOR_SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sponsorSessionMaxAgeSeconds,
    path: "/",
  });
  return res;
}
