import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, SESSION_MAX_AGE, verifySession } from "./session";

export const getToken = cache(async () => (await cookies()).get(SESSION_COOKIE)?.value);

export const getSession = cache(async () => verifySession(await getToken()));

/** remember=false makes it a browser-session cookie, cleared when the browser closes. */
export async function setSessionToken(token: string, remember = true) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: SESSION_MAX_AGE } : {}),
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Server-side guard: returns the session or redirects to login. */
export async function requireUser(next = "/account") {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}

/** Guard for admin pages. The API enforces this too. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/");
  return session;
}
