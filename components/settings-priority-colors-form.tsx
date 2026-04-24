import { updatePriorityColors } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/task-priority";
import type { PriorityColorMap } from "@/lib/user-priority-colors";

export function SettingsPriorityColorsForm({
  colors,
}: {
  colors: PriorityColorMap;
}) {
  return (
    <form action={updatePriorityColors} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {TASK_PRIORITIES.map((p) => (
          <div key={p} className="flex flex-wrap items-center gap-3">
            <Label
              htmlFor={`prio-color-${p}`}
              className="min-w-[4.5rem] text-sm font-medium"
            >
              {TASK_PRIORITY_LABELS[p]}
            </Label>
            <input
              id={`prio-color-${p}`}
              name={`priorityColor_${p}`}
              type="color"
              defaultValue={colors[p]}
              className="border-input bg-background h-9 w-14 cursor-pointer rounded-md border p-0.5"
              aria-label={`${TASK_PRIORITY_LABELS[p]}の色`}
            />
          </div>
        ))}
      </div>
      <Button type="submit" size="sm" variant="secondary">
        優先度の色を保存
      </Button>
      <p className="text-muted-foreground text-xs">
        「なし」はタスク一覧では帯を表示しませんが、ここで色を指定しておくと一貫してプレビュー等に使えます。
      </p>
    </form>
  );
}
