import { normalizeHexColor } from "@/lib/hex-color";
import {
  DEFAULT_PRIORITY_COLORS,
  TASK_PRIORITIES,
  type TaskPriority,
} from "@/lib/task-priority";

export type PriorityColorMap = Record<TaskPriority, string>;

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
