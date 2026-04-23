import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, programs } from "@/db/schema";

const INBOX_PROGRAM_NAME = "受信箱";
const INBOX_PROJECT_NAME = "Inbox";

/**
 * 初回 Google 登録直後: Inbox 用 Program ＋ Project を1トランザクションで作成
 * [IMPLEMENTATION-SPEC §4]
 */
export async function createInboxForNewUser(userId: string) {
  await db.transaction(async (tx) => {
    const [program] = await tx
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

    await tx.insert(projects).values({
      userId,
      programId: program.id,
      name: INBOX_PROJECT_NAME,
      isInbox: true,
    });
  });
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
