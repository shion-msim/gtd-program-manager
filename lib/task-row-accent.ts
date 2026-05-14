import {
  resolveAccentToken,
  type AccentToken,
} from "@/lib/design-tokens";
import {
  DEFAULT_PRIORITY_TOKENS,
  TASK_PRIORITIES,
  type TaskPriority,
} from "@/lib/task-priority";

export type PriorityColorMap = Record<TaskPriority, AccentToken>;

/** none は帯を出さない想定で null。それ以外はマップから色を返す */
export function priorityStripeColor(
  priority: string,
  merged: PriorityColorMap,
): AccentToken | null {
  if (priority === "none") {
    return null;
  }
  if (!TASK_PRIORITIES.includes(priority as TaskPriority)) {
    return null;
  }
  const k = priority as TaskPriority;
  return merged[k] ?? DEFAULT_PRIORITY_TOKENS[k];
}

/** タスク行の「プロジェクト色」: プロジェクト優先、なければプログラム */
export function resolveTaskEntityAccent(
  projectAccent: string | null | undefined,
  programAccent: string | null | undefined,
): AccentToken | null {
  const projectToken = resolveAccentToken(projectAccent);
  if (projectToken) {
    return projectToken;
  }
  return resolveAccentToken(programAccent);
}
