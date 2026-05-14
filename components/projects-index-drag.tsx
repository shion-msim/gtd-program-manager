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
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ProjectListRow } from "@/lib/cross-project-views";

import { ListRowEdgeAccent } from "@/components/list-row-edge-accent";
import { reorderProjectsInProgram } from "@/lib/navigation-order-actions";
import { resolveTaskEntityAccent } from "@/lib/task-row-accent";
import { useIsClient } from "@/lib/use-is-client";
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
  const suffix = row.isInbox ? "（受信箱）" : row.isArchived ? "（アーカイブ）" : null;

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

function ProgramSectionDndInner({
  sec,
  sortablesFromProp,
}: {
  sec: { programId: string; programName: string; items: ProjectListRow[] };
  sortablesFromProp: ProjectListRow[];
}) {
  const router = useRouter();
  const [orderedRows, setOrderedRows] = useState(sortablesFromProp);
  const draggableIds = orderedRows.map((r) => r.projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = draggableIds.indexOf(String(active.id));
    const newIndex = draggableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const prev = orderedRows;
    const nextRows = arrayMove(orderedRows, oldIndex, newIndex);
    setOrderedRows(nextRows);
    const nextOrder = nextRows.map((r) => r.projectId);
    void (async () => {
      try {
        const r = await reorderProjectsInProgram(sec.programId, nextOrder);
        if (!r.ok) {
          setOrderedRows(prev);
          toast.error("並べ替えを保存できませんでした");
          return;
        }
        router.refresh();
      } catch {
        setOrderedRows(prev);
        toast.error("並べ替えを保存できませんでした");
      }
    })();
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={draggableIds} strategy={verticalListSortingStrategy}>
        <>
          {orderedRows.map((row) => (
            <SortableIndexProjectRow key={row.projectId} row={row} />
          ))}
        </>
      </SortableContext>
    </DndContext>
  );
}

function ProgramSection({
  sec,
}: {
  sec: { programId: string; programName: string; items: ProjectListRow[] };
}) {
  const dndReady = useIsClient();

  const archivedRows = useMemo(
    () => sec.items.filter((r) => !r.isInbox && r.isArchived),
    [sec.items],
  );
  const inboxRow = useMemo(() => {
    const visibleItems = sec.items.filter((r) => !r.isArchived);
    return visibleItems.find((r) => r.isInbox);
  }, [sec.items]);

  const sortablesFromProp = useMemo(() => {
    const visibleItems = sec.items.filter((r) => !r.isArchived);
    return inboxRow ? visibleItems.filter((r) => !r.isInbox) : visibleItems;
  }, [sec.items, inboxRow]);

  const serverOrderKey = sortablesFromProp.map((r) => r.projectId).join("|");

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
          <ProgramSectionDndInner
            key={serverOrderKey}
            sec={sec}
            sortablesFromProp={sortablesFromProp}
          />
        ) : (
          sortablesFromProp.map((row) => (
            <FrozenIndexProjectRow
              key={row.projectId}
              row={row}
              gripPlaceholder
            />
          ))
        )}
      </ul>
      {archivedRows.length > 0 ? (
        <div className="mt-2 space-y-1">
          <p className="text-muted-foreground text-xs font-medium">アーカイブ済み</p>
          <ul className="divide-border divide-y overflow-hidden rounded-lg border text-sm opacity-90">
            {archivedRows.map((row) => (
              <FrozenIndexProjectRow key={row.projectId} row={row} />
            ))}
          </ul>
        </div>
      ) : null}
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
