import Link from "next/link";
import { contrastForegroundForBackground, normalizeHexColor } from "@/lib/hex-color";
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
  priorityColor: string | null;
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
  const bg = normalizeHexColor(accent ?? "");
  return (
    <Link
      href={href}
      className={cn(
        "inline-block max-w-[12rem] truncate rounded-md px-1.5 py-0.5 text-xs font-medium no-underline transition-opacity hover:opacity-90",
        !bg && "bg-muted text-muted-foreground",
      )}
      style={
        bg
          ? {
              backgroundColor: bg,
              color: contrastForegroundForBackground(bg),
            }
          : undefined
      }
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
  color: string | null;
  priority: string;
}) {
  const label = isTaskPriority(priority)
    ? TASK_PRIORITY_LABELS[priority]
    : priority;
  const bg = color ? normalizeHexColor(color) : null;
  return (
    <span
      className={cn(
        "inline-block max-w-[8rem] truncate rounded-md px-1.5 py-0.5 text-xs font-medium",
        !bg && "bg-muted text-muted-foreground",
      )}
      style={
        bg
          ? {
              backgroundColor: bg,
              color: contrastForegroundForBackground(bg),
            }
          : undefined
      }
      title={label}
    >
      {label}
    </span>
  );
}
