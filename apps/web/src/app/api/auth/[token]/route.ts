import { schema } from "@app0/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionForUser, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

/** Magic-link prihlásenie: jednorazový token → session cookie → /ucet. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  const db = getDb();

  const [loginToken] = /^[a-f0-9-]{36}$/.test(token)
    ? await db
        .update(schema.loginTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(schema.loginTokens.token, token),
            isNull(schema.loginTokens.usedAt),
            gt(schema.loginTokens.expiresAt, new Date()),
          ),
        )
        .returning()
    : [];

  if (!loginToken) redirect("/ucet?stav=neplatny");

  let user = await db.query.users.findFirst({
    where: eq(schema.users.email, loginToken.email),
  });
  if (!user) {
    [user] = await db.insert(schema.users).values({ email: loginToken.email }).returning();
  }

  const sessionToken = await createSessionForUser(user!.id);
  (await cookies()).set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
  redirect("/ucet");
}
