import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userAppSettings } from "@/db/schema";
import { isAccentToken } from "@/lib/design-tokens";
import type { PriorityColorMap } from "@/lib/task-row-accent";
import { DEFAULT_PRIORITY_TOKENS, TASK_PRIORITIES } from "@/lib/task-priority";

function parseStoredJson(raw: string): Partial<PriorityColorMap> {
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== "object" || o === null || Array.isArray(o)) {
      return {};
    }
    const out: Partial<PriorityColorMap> = {};
    for (const k of TASK_PRIORITIES) {
      const v = (o as Record<string, unknown>)[k];
      if (typeof v === "string" && isAccentToken(v)) {
        out[k] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** DB の上書きと既定値をマージしたマップ */
export async function getPriorityColorsForUser(
  userId: string,
): Promise<PriorityColorMap> {
  const [row] = await db
    .select({ json: userAppSettings.priorityColorsJson })
    .from(userAppSettings)
    .where(eq(userAppSettings.userId, userId))
    .limit(1);
  const overrides = row?.json ? parseStoredJson(row.json) : {};
  return { ...DEFAULT_PRIORITY_TOKENS, ...overrides };
}

export type { PriorityColorMap } from "@/lib/task-row-accent";
