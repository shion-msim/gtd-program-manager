import { cn } from "@/lib/utils";
import {
  accentEdgeClass,
  type AccentToken,
} from "@/lib/design-tokens";

type Tag = "li" | "div" | "tr";

type Props = {
  /** プロジェクト／プログラム由来の左帯（未設定はテーマの muted 帯） */
  entityColor: AccentToken | null;
  /** 優先度帯（null のときは帯色なし・幅は他行と揃えるため確保） */
  priorityColor: AccentToken | null;
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
          className={cn("w-1.5 self-stretch", accentEdgeClass(entityColor))}
        />
        <span className={cn("w-1 self-stretch", accentEdgeClass(priorityColor))} />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </Tag>
  );
}
