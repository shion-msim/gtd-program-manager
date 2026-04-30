"use client";

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
import type { ProjectListRow } from "@/lib/cross-project-views";

import { ListRowEdgeAccent } from "@/components/list-row-edge-accent";
import { reorderProjectsInProgram } from "@/lib/navigation-order-actions";
import { resolveTaskEntityAccent } from "@/lib/task-row-accent";
import { cn } from "@/lib/utils";

function FrozenIndexProjectRow({
  row,
  gripPlaceholder,
}: {
  row: ProjectListRow;
  /** 並べ替え行の SSR 用に、ドラッグ行と同じ左スペースを確保する */
  gripPlaceholder?: boolean;
}) {
  const href = row.isInbox ? "/inbox" : `/projects/${row.projectId}`;
  const suffix = row.isInbox ? "（受信箱）" : null;

  const body = (
    <ListRowEdgeAccent
      as="div"
      entityColor={resolveTaskEntityAccent(
        row.projectAccent,
        row.programAccent,
      )}
      priorityColor={null}
    >
      <div className="px-3 py-3">
        <Link
          href={href}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {row.projectName}
          {suffix}
        </Link>
      </div>
    </ListRowEdgeAccent>
  );

  if (gripPlaceholder) {
    return (
      <li className="flex min-w-0 items-stretch">
        <div
          className="bg-muted/40 text-muted-foreground shrink-0 self-stretch border-r border-border px-2 outline-none flex flex-col items-center justify-center"
          aria-hidden
        >
          <GripVertical className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">{body}</div>
      </li>
    );
  }

  return <li className="min-w-0">{body}</li>;
}

function SortableIndexProjectRow({ row }: { row: ProjectListRow }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.projectId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const href = `/projects/${row.projectId}`;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex min-w-0",
        "items-stretch",
        isDragging && "z-50",
      )}
    >
      <button
        type="button"
        className="bg-muted/40 text-muted-foreground hover:bg-muted/70 shrink-0 self-stretch border-r border-border px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="ドラッグして並べ替え"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <ListRowEdgeAccent
          as="div"
          entityColor={resolveTaskEntityAccent(
            row.projectAccent,
            row.programAccent,
          )}
          priorityColor={null}
        >
          <div className="px-3 py-3">
            <Link
              href={href}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              {row.projectName}
            </Link>
          </div>
        </ListRowEdgeAccent>
      </div>
    </li>
  );
}

function ProgramSection({
  sec,
}: {
  sec: { programId: string; programName: string; items: ProjectListRow[] };
}) {
  const router = useRouter();
  const [dndReady, setDndReady] = useState(false);
  useEffect(() => {
    setDndReady(true);
  }, []);

  const inboxRow = sec.items.find((r) => r.isInbox);
  const sortables = inboxRow
    ? sec.items.filter((r) => !r.isInbox)
    : sec.items;
  const draggableIds = sortables.map((r) => r.projectId);

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
    const nextOrder = arrayMove(draggableIds, oldIndex, newIndex);
    await reorderProjectsInProgram(sec.programId, nextOrder);
    router.refresh();
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">
        <Link
          href={`/programs/${sec.programId}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          {sec.programName}
        </Link>
      </h2>
      <ul className="divide-border divide-y overflow-hidden rounded-lg border text-sm">
        {inboxRow ? (
          <FrozenIndexProjectRow key={inboxRow.projectId} row={inboxRow} />
        ) : null}
        {dndReady ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={draggableIds} strategy={verticalListSortingStrategy}>
              <>
                {sortables.map((row) => (
                  <SortableIndexProjectRow key={row.projectId} row={row} />
                ))}
              </>
            </SortableContext>
          </DndContext>
        ) : (
          sortables.map((row) => (
            <FrozenIndexProjectRow
              key={row.projectId}
              row={row}
              gripPlaceholder
            />
          ))
        )}
      </ul>
    </section>
  );
}

export function ProjectsIndexDrag({
  sections,
}: {
  sections: { programId: string; programName: string; items: ProjectListRow[] }[];
}) {
  return (
    <>
      {sections.map((sec) => (
        <ProgramSection key={sec.programId} sec={sec} />
      ))}
    </>
  );
}
