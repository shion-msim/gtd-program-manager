import { updatePriorityColors } from "@/app/settings/actions";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ACCENT_TOKENS } from "@/lib/design-tokens";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/task-priority";
import type { PriorityColorMap } from "@/lib/task-row-accent";

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
              className="token-label-min text-sm font-medium"
            >
              {TASK_PRIORITY_LABELS[p]}
            </Label>
            <NativeSelect
              id={`prio-color-${p}`}
              name={`priorityColor_${p}`}
              defaultValue={colors[p]}
              aria-label={`${TASK_PRIORITY_LABELS[p]}の色`}
              className="token-form-select-min"
            >
              {ACCENT_TOKENS.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </NativeSelect>
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
