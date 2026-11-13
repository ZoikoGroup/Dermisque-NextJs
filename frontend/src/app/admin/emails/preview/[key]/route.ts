import { getSession, getToken } from "@/lib/auth";

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

/** Streams a rendered email template (sample data) from the API so it can be shown in an iframe. */
export async function GET(_: Request, ctx: RouteContext<"/admin/emails/preview/[key]">) {
  const session = await getSession();
  if (session?.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { key } = await ctx.params;
  const res = await fetch(`${API_URL}/api/admin/emails/preview/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${await getToken()}` },
    cache: "no-store",
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Frame-Options": "SAMEORIGIN" },
  });
}
