export const TASK_STATUSES = [
  "inbox",
  "next",
  "in_progress",
  "waiting",
  "done",
  "someday",
] as const;

/** Inbox タスクの編集で選べる状態（完了は「完了」ボタンへ誘導） */
export const INBOX_EDITABLE_STATUSES = TASK_STATUSES.filter((s) => s !== "done");

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  inbox: "受信箱（未整理）",
  next: "次の行動",
  in_progress: "実行中",
  waiting: "待ち",
  done: "完了",
  someday: "いつか",
};

export function taskStatusLabel(status: string): string {
  return isTaskStatus(status) ? TASK_STATUS_LABELS[status] : status;
}

const SET = new Set<string>(TASK_STATUSES);

export function isTaskStatus(s: string): s is TaskStatus {
  return SET.has(s);
}
