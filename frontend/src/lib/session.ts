// Edge-safe verification of the JWT issued by the Python backend.
// Used by proxy.ts and server code; the secret must match backend JWT_SECRET.
import { jwtVerify } from "jose";

export const SESSION_COOKIE = "dq_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set (frontend/.env) — it must match the backend");
  return new TextEncoder().encode(s);
}

export async function verifySession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
