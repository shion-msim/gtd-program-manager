import { auth } from "@/auth";
import { ProjectTaskFullEditForm } from "@/components/project-task-full-edit-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProjectTaskForEdit } from "@/lib/project-task-edit";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string; taskId: string }> };

export default async function ProjectTaskEditPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const { id: projectId, taskId } = await params;
  const row = await getProjectTaskForEdit(session.user.id, projectId, taskId);
  if (!row) {
    notFound();
  }
  const { task, program, project } = row;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <p className="text-muted-foreground text-sm">
        <Link href="/programs" className="underline underline-offset-4">
          プログラム一覧
        </Link>
        {" · "}
        <Link
          href={`/programs/${program.id}`}
          className="underline underline-offset-4"
        >
          {program.name}
        </Link>
        {" · "}
        <Link
          href={`/projects/${projectId}`}
          className="underline underline-offset-4"
        >
          {project.name}
        </Link>
      </p>
      <header>
        <h1 className="text-xl font-semibold">タスクを編集</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          メモ・〆切・状態を更新するか、削除できます。
        </p>
      </header>

      <Card size="sm">
        <CardHeader>
          <CardTitle>内容</CardTitle>
          <CardDescription>保存するとプロジェクトのタスク一覧に戻ります。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProjectTaskFullEditForm
            projectId={projectId}
            task={{
              id: task.id,
              title: task.title,
              note: task.note,
              dueOn: task.dueOn,
              status: task.status,
              priority: task.priority,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
