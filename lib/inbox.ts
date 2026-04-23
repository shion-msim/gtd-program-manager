import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, programs } from "@/db/schema";

const INBOX_PROGRAM_NAME = "受信箱";
const INBOX_PROJECT_NAME = "Inbox";

/**
 * 初回 Google 登録直後: Inbox 用 Program ＋ Project を作成。
 * Neon HTTP ドライバは transaction 非対応のため逐次 INSERT（失敗時は Program を削除して巻き戻し）。
 * [IMPLEMENTATION-SPEC §4]
 */
export async function createInboxForNewUser(userId: string) {
  const [program] = await db
    .insert(programs)
    .values({
      userId,
      name: INBOX_PROGRAM_NAME,
      startOn: null,
      endOn: null,
    })
    .returning({ id: programs.id });

  if (!program) {
    throw new Error("Inbox 用プログラムの作成に失敗しました");
  }

  try {
    await db.insert(projects).values({
      userId,
      programId: program.id,
      name: INBOX_PROJECT_NAME,
      isInbox: true,
    });
  } catch (e) {
    await db.delete(programs).where(eq(programs.id, program.id));
    throw e;
  }
}

/**
 * 冪等: 既に Inbox プロジェクトがあれば何もしない
 */
export async function ensureInboxForUser(userId: string) {
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(eq(projects.userId, userId), eq(projects.isInbox, true)),
    )
    .limit(1);
  if (existing) {
    return;
  }
  await createInboxForNewUser(userId);
}

export async function getInboxProjectId(
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(eq(projects.userId, userId), eq(projects.isInbox, true)),
    )
    .limit(1);
  return row?.id ?? null;
}
