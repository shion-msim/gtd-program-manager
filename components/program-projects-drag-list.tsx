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
import { Archive, GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { projects } from "@/db/schema";
import { reorderProjectsInProgram } from "@/lib/navigation-order-actions";

import { ProgramProjectDeleteConfirm } from "@/components/program-project-delete-confirm";
import { ProjectEditDialog } from "@/components/project-edit-dialog";
import { ListRowEdgeAccent } from "@/components/list-row-edge-accent";
import { resolveAccentToken } from "@/lib/design-tokens";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

export type ProgramProjectsDragProject = Pick<
  InferSelectModel<typeof projects>,
  "id" | "name" | "accentColor" | "isInbox" | "isArchived"
>;

function FrozenInboxProjectRow({ proj }: { proj: ProgramProjectsDragProject }) {
  return (
    <li className="flex min-w-0">
      <ListRowEdgeAccent
        as="div"
        entityColor={resolveAccentToken(proj.accentColor)}
        priorityColor={null}
        className="min-w-0 flex-1"
      >
        <div className="space-y-3 p-4">
          <div>
            <p className="font-medium">{proj.name}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              システム管理の Inbox です。名前の変更や削除はできません。
            </p>
            <p className="mt-2">
              <Link
                href="/inbox"
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                受信箱でタスクを見る
              </Link>
            </p>
          </div>
        </div>
      </ListRowEdgeAccent>
    </li>
  );
}

/** SSR / hydration では dnd-kit の aria ID がズレるため、マウント前はこれを描画する */
function FrozenNormProjectRow({ proj }: { proj: ProgramProjectsDragProject }) {
  const router = useRouter();
  return (
    <li className="flex min-w-0">
      <div
        className="bg-muted/40 text-muted-foreground shrink-0 self-stretch border-r border-border px-1.5 flex flex-col items-center justify-center"
        aria-hidden
      >
        <GripVertical className="size-4" aria-hidden />
      </div>
      <ListRowEdgeAccent
        as="div"
        entityColor={resolveAccentToken(proj.accentColor)}
        priorityColor={null}
        className="min-w-0 flex-1"
      >
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 font-medium">{proj.name}</p>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/projects/${proj.id}`}
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                タスク一覧
              </Link>
              <ProjectEditDialog
                project={{
                  id: proj.id,
                  name: proj.name,
                  accentColor: proj.accentColor,
                  isArchived: proj.isArchived,
                }}
              />
            </div>
          </div>
          <ProgramProjectDeleteConfirm
            projectId={proj.id}
            onDeleted={() => {
              router.refresh();
            }}
          />
        </div>
      </ListRowEdgeAccent>
    </li>
  );
}

function ArchivedProjectRow({ proj }: { proj: ProgramProjectsDragProject }) {
  const router = useRouter();
  return (
    <li className="flex min-w-0">
      <div
        className="bg-muted/20 text-muted-foreground shrink-0 self-stretch border-r border-border px-1.5 flex flex-col items-center justify-center"
        title="アーカイブ済み（並べ替え対象外）"
      >
        <Archive className="size-4 opacity-60" aria-hidden />
      </div>
      <ListRowEdgeAccent
        as="div"
        entityColor={resolveAccentToken(proj.accentColor)}
        priorityColor={null}
        className="bg-muted/10 min-w-0 flex-1"
      >
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground min-w-0 font-medium">{proj.name}</p>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/projects/${proj.id}`}
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                タスク一覧
              </Link>
              <ProjectEditDialog
                project={{
                  id: proj.id,
                  name: proj.name,
                  accentColor: proj.accentColor,
                  isArchived: proj.isArchived,
                }}
              />
            </div>
          </div>
          <ProgramProjectDeleteConfirm
            projectId={proj.id}
            onDeleted={() => {
              router.refresh();
            }}
          />
        </div>
      </ListRowEdgeAccent>
    </li>
  );
}

function SortableNormProjectRow({ proj }: { proj: ProgramProjectsDragProject }) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: proj.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className={cn("flex min-w-0", isDragging && "z-50")}>
      <button
        type="button"
        className="bg-muted/40 text-muted-foreground hover:bg-muted/70 shrink-0 self-stretch border-r border-border px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="ドラッグして並べ替え"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <ListRowEdgeAccent
        as="div"
        entityColor={resolveAccentToken(proj.accentColor)}
        priorityColor={null}
        className="min-w-0 flex-1"
      >
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 font-medium">{proj.name}</p>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/projects/${proj.id}`}
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                タスク一覧
              </Link>
              <ProjectEditDialog
                project={{
                  id: proj.id,
                  name: proj.name,
                  accentColor: proj.accentColor,
                  isArchived: proj.isArchived,
                }}
              />
            </div>
          </div>
          <ProgramProjectDeleteConfirm
            projectId={proj.id}
            onDeleted={() => {
              router.refresh();
            }}
          />
        </div>
      </ListRowEdgeAccent>
    </li>
  );
}

function ProgramProjectsDragDndInner({
  programId,
  sortablesFromProp,
}: {
  programId: string;
  sortablesFromProp: ProgramProjectsDragProject[];
}) {
  const router = useRouter();
  const [orderedSortables, setOrderedSortables] = useState(sortablesFromProp);

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
    const ids = orderedSortables.map((p) => p.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const prev = orderedSortables;
    const nextSortables = arrayMove(orderedSortables, oldIndex, newIndex);
    setOrderedSortables(nextSortables);
    const nextOrder = nextSortables.map((p) => p.id);
    void (async () => {
      try {
        const r = await reorderProjectsInProgram(programId, nextOrder);
        if (!r.ok) {
          setOrderedSortables(prev);
          toast.error("並べ替えを保存できませんでした");
          return;
        }
        router.refresh();
      } catch {
        setOrderedSortables(prev);
        toast.error("並べ替えを保存できませんでした");
      }
    })();
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedSortables.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <>
          {orderedSortables.map((proj) => (
            <SortableNormProjectRow key={proj.id} proj={proj} />
          ))}
        </>
      </SortableContext>
    </DndContext>
  );
}

export function ProgramProjectsDragList({
  programId,
  projectsOrdered,
  archivedProjects = [],
}: {
  programId: string;
  projectsOrdered: ProgramProjectsDragProject[];
  archivedProjects?: ProgramProjectsDragProject[];
}) {
  const dndReady = useIsClient();

  const inboxProj = useMemo(
    () => projectsOrdered.find((p) => p.isInbox),
    [projectsOrdered],
  );
  const sortablesFromProp = useMemo(
    () => (inboxProj ? projectsOrdered.filter((p) => !p.isInbox) : projectsOrdered),
    [projectsOrdered, inboxProj],
  );
  const serverOrderKey = sortablesFromProp.map((p) => p.id).join("|");

  return (
    <div className="space-y-6">
      <ul className="divide-border divide-y overflow-hidden rounded-lg border" data-testid="program-projects-list">
        {inboxProj ? <FrozenInboxProjectRow proj={inboxProj} /> : null}
        {dndReady ? (
          <ProgramProjectsDragDndInner
            key={serverOrderKey}
            programId={programId}
            sortablesFromProp={sortablesFromProp}
          />
        ) : (
          sortablesFromProp.map((proj) => (
            <FrozenNormProjectRow key={proj.id} proj={proj} />
          ))
        )}
      </ul>
      {archivedProjects.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-sm font-medium">アーカイブ済み</h3>
          <ul
            className="divide-border divide-y overflow-hidden rounded-lg border"
            data-testid="program-archived-projects"
          >
            {archivedProjects.map((proj) => (
              <ArchivedProjectRow key={proj.id} proj={proj} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
