"use client";

import type { InferSelectModel } from "drizzle-orm";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { programs } from "@/db/schema";
import { reorderProgramsForNavigation } from "@/lib/navigation-order-actions";
import { ProgramDeleteWithHint } from "@/components/program-delete-with-hint";
import { ProgramEditDialog } from "@/components/program-edit-dialog";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeHexColor } from "@/lib/hex-color";
import { cn } from "@/lib/utils";

export type ProgramsDragReorderListItem = Pick<
  InferSelectModel<typeof programs>,
  "id" | "name" | "startOn" | "endOn" | "accentColor"
>;

function FrozenProgramRow({
  program,
  isInboxProgram,
  deleteAction,
}: {
  program: ProgramsDragReorderListItem;
  isInboxProgram: boolean;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const accent =
    program.accentColor !== null && program.accentColor !== undefined
      ? normalizeHexColor(program.accentColor)
      : null;

  const deleteHint =
    isInboxProgram ? (
      <p className="text-xs leading-relaxed">
        このプログラムには受信箱（Inbox）用のプロジェクトが常に含まれるため、子プロジェクトを 0 件にすることはできず、削除もできません。未整理タスクの整理は
        <Link
          href="/inbox"
          className="text-primary mx-0.5 underline underline-offset-2"
        >
          受信箱
        </Link>
        から行えます。
      </p>
    ) : undefined;

  return (
    <li>
      <div className="flex overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <div
          className="bg-muted/20 flex w-9 shrink-0 items-center justify-center border-r border-foreground/10"
          aria-hidden
        />
        <div
          className="w-1.5 shrink-0 self-stretch bg-muted-foreground/25"
          style={accent ? { backgroundColor: accent } : undefined}
          aria-hidden
        />
        <Card size="sm" className="flex-1 rounded-none border-0 shadow-none ring-0">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b pb-4">
            <div className="min-w-0 flex-1 space-y-1">
              <Link
                href={isInboxProgram ? "/inbox" : `/programs/${program.id}`}
                title={isInboxProgram ? "受信箱を開く" : "プロジェクト一覧を開く"}
                className="text-foreground block rounded-md outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CardTitle className="text-base font-semibold">{program.name}</CardTitle>
              </Link>
              <p className="text-muted-foreground text-xs">
                {program.startOn ? program.startOn : "（開始日なし）"} 〜{" "}
                {program.endOn ? program.endOn : "（終了日なし）"}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-start justify-end gap-1">
              <ProgramEditDialog
                program={{
                  id: program.id,
                  name: program.name,
                  startOn: program.startOn,
                  endOn: program.endOn,
                  accentColor: program.accentColor,
                }}
                disabled={isInboxProgram}
              />
              <ProgramDeleteWithHint
                programId={program.id}
                action={deleteAction}
                disabled={isInboxProgram}
                disabledHint={deleteHint}
              />
            </div>
          </CardHeader>
        </Card>
      </div>
    </li>
  );
}

function SortableProgramRow({
  program,
  deleteAction,
}: {
  program: ProgramsDragReorderListItem;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: program.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const accent =
    program.accentColor !== null && program.accentColor !== undefined
      ? normalizeHexColor(program.accentColor)
      : null;

  return (
    <li ref={setNodeRef} style={style} className={cn(isDragging && "z-50")}>
      <div className="flex overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <button
          type="button"
          className="bg-muted/40 text-muted-foreground hover:bg-muted/70 flex w-9 shrink-0 flex-col items-center justify-center border-r border-foreground/10 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="ドラッグして並べ替え"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <div
          className="w-1.5 shrink-0 self-stretch bg-muted-foreground/25"
          style={accent ? { backgroundColor: accent } : undefined}
          aria-hidden
        />
        <Card size="sm" className="flex-1 rounded-none border-0 shadow-none ring-0">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b pb-4">
            <div className="min-w-0 flex-1 space-y-1">
              <Link
                href={`/programs/${program.id}`}
                title="プロジェクト一覧を開く"
                className="text-foreground block rounded-md outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CardTitle className="text-base font-semibold">{program.name}</CardTitle>
              </Link>
              <p className="text-muted-foreground text-xs">
                {program.startOn ? program.startOn : "（開始日なし）"} 〜{" "}
                {program.endOn ? program.endOn : "（終了日なし）"}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-start justify-end gap-1">
              <ProgramEditDialog
                program={{
                  id: program.id,
                  name: program.name,
                  startOn: program.startOn,
                  endOn: program.endOn,
                  accentColor: program.accentColor,
                }}
                disabled={false}
              />
              <ProgramDeleteWithHint
                programId={program.id}
                action={deleteAction}
              />
            </div>
          </CardHeader>
        </Card>
      </div>
    </li>
  );
}

export function ProgramsDragReorderList({
  inboxProgramId,
  programsOrdered,
  deleteProgram,
}: {
  inboxProgramId: string | null;
  programsOrdered: ProgramsDragReorderListItem[];
  deleteProgram: (programId: string, formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [dndReady, setDndReady] = useState(false);
  useEffect(() => {
    setDndReady(true);
  }, []);

  const draggableIds =
    inboxProgramId === null
      ? programsOrdered.map((p) => p.id)
      : programsOrdered.filter((p) => p.id !== inboxProgramId).map((p) => p.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = draggableIds.indexOf(String(active.id));
    const newIndex = draggableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const nextDragOrder = arrayMove(draggableIds, oldIndex, newIndex);
    await reorderProgramsForNavigation(nextDragOrder);
    router.refresh();
  }

  const sortables =
    inboxProgramId === null
      ? programsOrdered
      : programsOrdered.filter((p) => p.id !== inboxProgramId);

  const inboxRow =
    inboxProgramId !== null
      ? programsOrdered.find((p) => p.id === inboxProgramId)
      : undefined;

  return (
    <ul className="space-y-4" data-testid="programs-list">
      {inboxRow ? (
        <FrozenProgramRow
          program={inboxRow}
          isInboxProgram
          deleteAction={deleteProgram.bind(null, inboxRow.id)}
        />
      ) : null}
      {dndReady ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortables.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <>
              {sortables.map((p) => (
                <SortableProgramRow
                  key={p.id}
                  program={p}
                  deleteAction={deleteProgram.bind(null, p.id)}
                />
              ))}
            </>
          </SortableContext>
        </DndContext>
      ) : (
        sortables.map((p) => (
          <FrozenProgramRow
            key={p.id}
            program={p}
            isInboxProgram={false}
            deleteAction={deleteProgram.bind(null, p.id)}
          />
        ))
      )}
    </ul>
  );
}
