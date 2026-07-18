import { cookies } from "next/headers";
import { schema } from "@app0/db";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "./db";

export const SESSION_COOKIE = "app0_session";
const SESSION_DAYS = 30;

export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const [row] = await db
    .select({ user: schema.users, session: schema.sessions })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.token, token), gt(schema.sessions.expiresAt, new Date())));
  return row?.user ?? null;
}

export async function createSessionForUser(userId: number): Promise<string> {
  const token = crypto.randomUUID();
  await getDb()
    .insert(schema.sessions)
    .values({ token, userId, expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) });
  return token;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86_400,
    path: "/",
  };
}
