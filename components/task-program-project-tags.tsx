import Link from "next/link";
import {
  accentPillClass,
  resolveAccentToken,
  type AccentToken,
} from "@/lib/design-tokens";
import { isTaskPriority, TASK_PRIORITY_LABELS } from "@/lib/task-priority";
import { cn } from "@/lib/utils";

type Props = {
  programName: string;
  projectName: string;
  programId: string;
  projectId: string;
  programAccent: string | null;
  projectAccent: string | null;
  /** 未設定色は帯非表示に合わせ、ピルは muted 表示 */
  priorityColor: AccentToken | null;
  priority: string;
  className?: string;
};

/**
 * プログラム名・プロジェクト名・優先度の小さな色付きラベル（行末で右揃えに使う想定）
 */
export function TaskProgramProjectTags({
  programName,
  projectName,
  programId,
  projectId,
  programAccent,
  projectAccent,
  priorityColor,
  priority,
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-wrap items-baseline justify-end gap-1.5",
        className,
      )}
    >
      <Pill
        name={programName}
        href={`/programs/${programId}`}
        accent={programAccent}
      />
      <Pill
        name={projectName}
        href={`/projects/${projectId}`}
        accent={projectAccent}
      />
      <PriorityPill color={priorityColor} priority={priority} />
    </span>
  );
}

function Pill({
  name,
  href,
  accent,
}: {
  name: string;
  href: string;
  accent: string | null;
}) {
  const token = resolveAccentToken(accent);
  return (
    <Link
      href={href}
      className={cn(
        "token-pill-max inline-block truncate rounded-md px-1.5 py-0.5 text-xs font-medium no-underline transition-opacity hover:opacity-90",
        accentPillClass(token),
      )}
      title={name}
    >
      {name}
    </Link>
  );
}

function PriorityPill({
  color,
  priority,
}: {
  color: AccentToken | null;
  priority: string;
}) {
  const label = isTaskPriority(priority)
    ? TASK_PRIORITY_LABELS[priority]
    : priority;
  return (
    <span
      className={cn(
        "token-pill-priority-max inline-block truncate rounded-md px-1.5 py-0.5 text-xs font-medium",
        accentPillClass(color),
      )}
      title={label}
    >
      {label}
    </span>
  );
}
