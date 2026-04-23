export const TASK_STATUSES = [
  "inbox",
  "next",
  "in_progress",
  "waiting",
  "done",
  "someday",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

const SET = new Set<string>(TASK_STATUSES);

export function isTaskStatus(s: string): s is TaskStatus {
  return SET.has(s);
}
