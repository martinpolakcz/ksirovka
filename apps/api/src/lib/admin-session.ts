import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";

const COOKIE_NAME = "ksirovka_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function isAdminConfigured(): boolean {
  if (process.env.NODE_ENV === "production") {
    return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
  }
  return Boolean(config.ADMIN_PASSWORD);
}

export function passwordsMatch(provided: string, expected: string): boolean {
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

function sign(payload: string): string {
  return createHmac("sha256", config.ADMIN_SESSION_SECRET).update(payload).digest("base64url");
}

function cookieSecure(request: FastifyRequest): boolean {
  return request.protocol === "https" || process.env.NODE_ENV === "production";
}

function serializeCookie(value: string, maxAge: number, secure: boolean): string {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function setAdminSession(request: FastifyRequest, reply: FastifyReply): void {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  reply.header("Set-Cookie", serializeCookie(value, MAX_AGE_SEC, cookieSecure(request)));
}

export function clearAdminSession(request: FastifyRequest, reply: FastifyReply): void {
  reply.header("Set-Cookie", serializeCookie("", 0, cookieSecure(request)));
}

function readCookie(header: string | undefined): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return rest.join("=");
  }
  return null;
}

export function hasValidAdminSession(request: FastifyRequest): boolean {
  const raw = readCookie(request.headers.cookie);
  if (!raw) return false;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!isAdminConfigured()) {
    await reply.status(503).send({ error: "Admin není nastavený" });
    return;
  }
  if (!hasValidAdminSession(request)) {
    await reply.status(401).send({ error: "Nepřihlášen" });
  }
}
