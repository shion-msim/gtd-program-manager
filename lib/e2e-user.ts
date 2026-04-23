import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { createInboxForNewUser, ensureInboxForUser } from "@/lib/inbox";

/** Playwright 等で不変のテストユーザ ID（1 行で固定） */
export const E2E_USER_ID = "e2e00000-0000-4000-8000-000000000001";

const E2E_EMAIL = "e2e@example.test";
const E2E_NAME = "E2E ユーザー";

/**
 * 認証可のとき、DB に E2E 用ユーザー＋Inbox があることだけを保証する
 */
export async function ensureE2eUser() {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, E2E_USER_ID))
    .limit(1);
  if (!existing) {
    await db.insert(usersTable).values({
      id: E2E_USER_ID,
      email: E2E_EMAIL,
      name: E2E_NAME,
    });
    await createInboxForNewUser(E2E_USER_ID);
  } else {
    await ensureInboxForUser(E2E_USER_ID);
  }
  return { id: E2E_USER_ID, email: E2E_EMAIL, name: E2E_NAME };
}
