import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { programs, projects, tasks } from "@/db/schema";
import {
  addDaysYmd,
  getSixMonWeekBuckets,
  ymdFallsInRange,
  ymdInTimeZone,
} from "@/lib/calendar-buckets";

const DEFAULT_TZ = "Asia/Tokyo";

export function getDefaultTimeZone() {
  return DEFAULT_TZ;
}

/** 〆切がその週のバケットに入る未完了タスク（done 以外、〆切あり） */
export async function getWorkloadForUser(
  userId: string,
  timeZone: string = DEFAULT_TZ,
) {
  const todayYmd = ymdInTimeZone(new Date(), timeZone);
  const buckets = getSixMonWeekBuckets(todayYmd);
  const rows = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        ne(tasks.status, "done"),
        sql`${tasks.dueOn} is not null`,
      ),
    );
  const resultBuckets = buckets.map((b) => {
    const taskIds: string[] = [];
    for (const { task: t } of rows) {
      if (!t.dueOn) {
        continue;
      }
      if (ymdFallsInRange(t.dueOn, b.weekStart, b.endExclusive)) {
        taskIds.push(t.id);
      }
    }
    return {
      weekStart: b.weekStart,
      endExclusive: b.endExclusive,
      count: taskIds.length,
      taskIds,
    };
  });
  const withoutDue = await db
    .select({ n: count() })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        ne(tasks.status, "done"),
        sql`${tasks.dueOn} is null`,
      ),
    );
  const w = withoutDue[0]?.n ?? 0;
  return {
    timeZone,
    todayYmd,
    buckets: resultBuckets,
    withoutDueCount: w,
  };
}

export type WorkloadViewBucket = Awaited<
  ReturnType<typeof getWorkloadForUser>
>["buckets"][number] & { tasks: { id: string; title: string; dueOn: string | null }[] };

/** 週次負荷画面用: 件数＋週内タスクの抜粋 */
export async function getWorkloadViewForUser(
  userId: string,
  timeZone: string = DEFAULT_TZ,
) {
  const w = await getWorkloadForUser(userId, timeZone);
  const allIds = w.buckets.flatMap((b) => b.taskIds);
  let tasksById: Record<string, { id: string; title: string; dueOn: string | null }> =
    {};
  if (allIds.length > 0) {
    const rows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueOn: tasks.dueOn,
      })
      .from(tasks)
      .where(inArray(tasks.id, allIds));
    tasksById = Object.fromEntries(rows.map((r) => [r.id, r]));
  }
  const buckets: WorkloadViewBucket[] = w.buckets.map((b) => ({
    ...b,
    tasks: b.taskIds.map((id) => {
      const t = tasksById[id];
      return {
        id,
        title: t?.title ?? "（表示できません）",
        dueOn: t?.dueOn ?? null,
      };
    }),
  }));
  return { ...w, buckets };
}

export async function getSummaryForUser(
  userId: string,
  timeZone: string = DEFAULT_TZ,
) {
  const todayYmd = ymdInTimeZone(new Date(), timeZone);
  const within7DaysEnd = addDaysYmd(todayYmd, 6);

  const [inboxRow] = await db
    .select({ n: count() })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        eq(projects.isInbox, true),
        eq(tasks.status, "inbox"),
      ),
    );
  const inboxCount = inboxRow?.n ?? 0;

  const dueToday = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        eq(tasks.dueOn, todayYmd),
        ne(tasks.status, "done"),
      ),
    )
    .orderBy(desc(tasks.dueOn))
    .limit(3);

  const nextActions = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(eq(projects.userId, userId), eq(tasks.status, "next")),
    )
    .orderBy(desc(tasks.updatedAt))
    .limit(3);

  const [{ n: dueNext7Count }] = await db
    .select({ n: count() })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        ne(tasks.status, "done"),
        sql`${tasks.dueOn} is not null`,
        gte(tasks.dueOn, todayYmd),
        lte(tasks.dueOn, within7DaysEnd),
      ),
    );

  const activePrograms = await db
    .select()
    .from(programs)
    .where(
      and(
        eq(programs.userId, userId),
        or(
          sql`${programs.startOn} is null`,
          lte(programs.startOn, todayYmd),
        ),
        or(
          sql`${programs.endOn} is null`,
          gte(programs.endOn, todayYmd),
        ),
      ),
    )
    .orderBy(desc(programs.createdAt))
    .limit(20);

  return {
    timeZone: timeZone,
    todayYmd,
    inboxCount,
    dueToday: dueToday.map((r) => r.task),
    nextActions: nextActions.map((r) => r.task),
    dueNext7DaysCount: dueNext7Count,
    activePrograms,
  };
}
