import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userAppSettings } from "@/db/schema";
import { normalizeHexColor } from "@/lib/hex-color";
import {
  DEFAULT_PRIORITY_COLORS,
  TASK_PRIORITIES,
  type TaskPriority,
} from "@/lib/task-priority";

export type PriorityColorMap = Record<TaskPriority, string>;

function parseStoredJson(raw: string): Partial<PriorityColorMap> {
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== "object" || o === null || Array.isArray(o)) {
      return {};
    }
    const out: Partial<PriorityColorMap> = {};
    for (const k of TASK_PRIORITIES) {
      const v = (o as Record<string, unknown>)[k];
      if (typeof v === "string") {
        const n = normalizeHexColor(v);
        if (n) {
          out[k] = n;
        }
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
  return { ...DEFAULT_PRIORITY_COLORS, ...overrides };
}

/** none は帯を出さない想定で null。それ以外はマップから色を返す */
export function priorityStripeColor(
  priority: string,
  merged: PriorityColorMap,
): string | null {
  if (priority === "none") {
    return null;
  }
  if (!TASK_PRIORITIES.includes(priority as TaskPriority)) {
    return null;
  }
  const k = priority as TaskPriority;
  const c = merged[k];
  return normalizeHexColor(c) ?? DEFAULT_PRIORITY_COLORS[k];
}

/** タスク行の「プロジェクト色」: プロジェクト優先、なければプログラム */
export function resolveTaskEntityAccent(
  projectAccent: string | null | undefined,
  programAccent: string | null | undefined,
): string | null {
  const p = projectAccent ?? null;
  if (p) {
    const n = normalizeHexColor(p);
    if (n) {
      return n;
    }
  }
  const g = programAccent ?? null;
  if (!g) {
    return null;
  }
  return normalizeHexColor(g);
}
