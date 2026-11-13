import "server-only";
import { getToken } from "./auth";

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Attach the signed-in user's token (default true). */
  auth?: boolean;
  headers?: Record<string, string>;
};

/** Server-side call to the FastAPI backend. Throws ApiError with the backend's `detail`. */
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const url = new URL(API_URL + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
  if (opts.auth !== false) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(url, { method: opts.method ?? "GET", headers, body, cache: "no-store" });
  } catch {
    throw new ApiError(503, "Our store service is unavailable. Please try again shortly.");
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = typeof j.detail === "string" ? j.detail : detail;
    } catch {}
    throw new ApiError(res.status, detail);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

/** Like api(), but returns null on 404. */
export async function apiOrNull<T>(path: string, opts?: Options): Promise<T | null> {
  try {
    return await api<T>(path, opts);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** Wraps a mutation for server actions: returns {ok:true,data} or {ok:false,error}. */
export async function attempt<T>(fn: () => Promise<T>) {
  try {
    return { ok: true as const, data: await fn() };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
