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
import { projects } from "@/db/schema";
import { reorderProjectsInProgram } from "@/lib/navigation-order-actions";

import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { ProjectEditDialog } from "@/components/project-edit-dialog";
import { ListRowEdgeAccent } from "@/components/list-row-edge-accent";
import { normalizeHexColor } from "@/lib/hex-color";
import { cn } from "@/lib/utils";

export type ProgramProjectsDragProject = Pick<
  InferSelectModel<typeof projects>,
  "id" | "name" | "accentColor" | "isInbox"
>;

function FrozenInboxProjectRow({ proj }: { proj: ProgramProjectsDragProject }) {
  return (
    <li className="flex min-w-0">
      <ListRowEdgeAccent
        as="div"
        entityColor={
          proj.accentColor ? normalizeHexColor(proj.accentColor) : null
        }
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
function FrozenNormProjectRow({
  proj,
  deleteProject,
}: {
  proj: ProgramProjectsDragProject;
  deleteProject: (projectId: string, formData: FormData) => Promise<void>;
}) {
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
        entityColor={
          proj.accentColor ? normalizeHexColor(proj.accentColor) : null
        }
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
                }}
              />
            </div>
          </div>
          <ConfirmDeleteForm
            action={deleteProject.bind(null, proj.id)}
            title="このプロジェクトを削除しますか？"
            description="配下のタスクもすべて削除されます。"
            triggerLabel="削除"
            confirmLabel="削除する"
            triggerVariant="destructive"
          />
        </div>
      </ListRowEdgeAccent>
    </li>
  );
}

function SortableNormProjectRow({
  proj,
  deleteProject,
}: {
  proj: ProgramProjectsDragProject;
  deleteProject: (projectId: string, formData: FormData) => Promise<void>;
}) {
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
        entityColor={
          proj.accentColor ? normalizeHexColor(proj.accentColor) : null
        }
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
                }}
              />
            </div>
          </div>
          <ConfirmDeleteForm
            action={deleteProject.bind(null, proj.id)}
            title="このプロジェクトを削除しますか？"
            description="配下のタスクもすべて削除されます。"
            triggerLabel="削除"
            confirmLabel="削除する"
            triggerVariant="destructive"
          />
        </div>
      </ListRowEdgeAccent>
    </li>
  );
}

export function ProgramProjectsDragList({
  programId,
  projectsOrdered,
  deleteProject,
}: {
  programId: string;
  projectsOrdered: ProgramProjectsDragProject[];
  deleteProject: (projectId: string, formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [dndReady, setDndReady] = useState(false);
  useEffect(() => {
    setDndReady(true);
  }, []);

  const inboxRows = projectsOrdered.filter((p) => p.isInbox);
  const inboxProj = inboxRows[0];
  const sortables = inboxProj
    ? projectsOrdered.filter((p) => !p.isInbox)
    : projectsOrdered;

  const draggableIds = sortables.map((p) => p.id);

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
    await reorderProjectsInProgram(programId, nextOrder);
    router.refresh();
  }

  return (
    <ul className="divide-border divide-y overflow-hidden rounded-lg border" data-testid="program-projects-list">
      {inboxProj ? <FrozenInboxProjectRow proj={inboxProj} /> : null}
      {dndReady ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortables.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <>
              {sortables.map((proj) => (
                <SortableNormProjectRow
                  key={proj.id}
                  proj={proj}
                  deleteProject={deleteProject}
                />
              ))}
            </>
          </SortableContext>
        </DndContext>
      ) : (
        sortables.map((proj) => (
          <FrozenNormProjectRow
            key={proj.id}
            proj={proj}
            deleteProject={deleteProject}
          />
        ))
      )}
    </ul>
  );
}
