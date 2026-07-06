import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  encodeSession,
  decodeSession,
  sessionMaxAgeSeconds,
  type SessionPayload,
} from "@/lib/session";

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encodeSession(payload);
  const expires = new Date(Date.now() + sessionMaxAgeSeconds * 1000);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const getCurrentSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return await decodeSession(token);
});

export const requireAdmin = cache(async (): Promise<SessionPayload> => {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }
  return session;
});