export const TASK_PRIORITIES = ["none", "low", "medium", "high"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: "なし",
  low: "低",
  medium: "中",
  high: "高",
};

/** 設定画面・タスク編集の既定パレット */
export const DEFAULT_PRIORITY_COLORS: Record<TaskPriority, string> = {
  none: "#94a3b8",
  low: "#22c55e",
  medium: "#eab308",
  high: "#ef4444",
};

export function isTaskPriority(v: string): v is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(v);
}
