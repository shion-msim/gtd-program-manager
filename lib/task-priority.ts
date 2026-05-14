import { PRIORITY_TOKEN_DEFAULTS, type AccentToken } from "@/lib/design-tokens";

export const TASK_PRIORITIES = ["none", "low", "medium", "high"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: "なし",
  low: "低",
  medium: "中",
  high: "高",
};

/** 設定画面・タスク編集の既定トークン */
export const DEFAULT_PRIORITY_TOKENS: Record<TaskPriority, AccentToken> =
  PRIORITY_TOKEN_DEFAULTS;

export function isTaskPriority(v: string): v is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(v);
}
