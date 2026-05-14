import { CornerDownLeft } from "lucide-react";
import { addInboxTask } from "@/app/inbox/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function InboxQuickAdd({ returnPath }: { returnPath: string }) {
  return (
    <form action={addInboxTask} className="space-y-2" data-testid="inbox-quick-add">
      <div className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="inbox-quick-title" className="sr-only">
            タスク
          </label>
          <Input
            id="inbox-quick-title"
            name="title"
            type="text"
            autoComplete="off"
            required
            placeholder="1 行でタスクを追加"
            className="h-12 min-h-12 rounded-xl px-4 text-base shadow-sm md:text-lg"
          />
        </div>
        <Button
          type="submit"
          size="icon-lg"
          className="h-12 w-12 shrink-0 rounded-xl"
          aria-label="追加（Enter）"
        >
          <CornerDownLeft className="size-5" strokeWidth={2.25} aria-hidden />
        </Button>
      </div>
      <input type="hidden" name="returnPath" value={returnPath} />
      <p className="text-muted-foreground text-xs">Enter キーでもすぐ追加できます。</p>
    </form>
  );
}
