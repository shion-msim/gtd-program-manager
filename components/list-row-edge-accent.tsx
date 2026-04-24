import { cn } from "@/lib/utils";

type Tag = "li" | "div" | "tr";

type Props = {
  /** プロジェクト／プログラム由来の左帯（未設定はテーマの muted 帯） */
  entityColor: string | null;
  /** 優先度帯（null のときは帯色なし・幅は他行と揃えるため確保） */
  priorityColor: string | null;
  children: React.ReactNode;
  className?: string;
  as?: Tag;
};

/**
 * リスト行の左端に縦の色帯を付ける（エンティティ色＋任意で優先度色）
 */
export function ListRowEdgeAccent({
  entityColor,
  priorityColor,
  children,
  className,
  as: Tag = "div",
}: Props) {
  return (
    <Tag className={cn("flex min-w-0 items-stretch", className)}>
      <div className="flex shrink-0" aria-hidden>
        <span
          className={cn(
            "w-1.5 self-stretch",
            !entityColor && "bg-muted-foreground/25",
          )}
          style={entityColor ? { backgroundColor: entityColor } : undefined}
        />
        <span
          className="w-1 self-stretch"
          style={
            priorityColor ? { backgroundColor: priorityColor } : undefined
          }
        />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </Tag>
  );
}
