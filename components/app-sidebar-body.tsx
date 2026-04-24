"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  FolderKanbanIcon,
  FoldersIcon,
  InboxIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  SettingsIcon,
} from "lucide-react";

import type { SidebarNavData } from "@/lib/sidebar-nav-data";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { normalizeHexColor } from "@/lib/hex-color";
import { cn } from "@/lib/utils";

const TOP_NAV: {
  href: string;
  label: string;
  testId?: string;
  Icon: typeof InboxIcon;
}[] = [
  { href: "/inbox", label: "受信箱", testId: "nav-inbox", Icon: InboxIcon },
  { href: "/dashboard", label: "ダッシュボード", Icon: LayoutDashboardIcon },
  { href: "/workload", label: "負荷", testId: "nav-workload", Icon: BarChart3Icon },
  { href: "/programs", label: "プログラム一覧", Icon: FolderKanbanIcon },
  { href: "/projects", label: "プロジェクト一覧", testId: "nav-projects", Icon: FoldersIcon },
  { href: "/tasks", label: "タスク一覧", testId: "nav-tasks", Icon: ListTodoIcon },
  { href: "/settings", label: "設定", testId: "nav-settings", Icon: SettingsIcon },
];

function isNavActive(href: string, pathname: string) {
  if (href === "/programs") {
    return pathname === "/programs" || pathname.startsWith("/programs/");
  }
  if (href === "/projects") {
    return pathname === "/projects" || pathname.startsWith("/projects/");
  }
  if (href === "/tasks") {
    return pathname === "/tasks" || pathname.startsWith("/tasks/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebarBody({
  data,
  collapsed,
  onNavigate,
  className,
}: {
  data: SidebarNavData;
  collapsed: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col gap-2 overflow-y-auto p-3",
        className,
      )}
    >
      <nav aria-label="メイン" className="flex flex-col gap-0.5">
        {TOP_NAV.map(({ href, label, testId, Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              data-testid={testId}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!collapsed ? <span className="truncate">{label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <>
          <Separator className="my-1" />
          <p className="text-muted-foreground px-1 text-xs font-medium tracking-wide">
            プログラム
          </p>
          <Accordion multiple defaultValue={[]} className="min-w-0 gap-2">
            {data.programs.map((program) => (
              <AccordionItem key={program.id} value={program.id}>
                <AccordionHeader className="px-0">
                  <AccordionTrigger className="border-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-4 w-1.5 shrink-0 rounded-sm bg-muted-foreground/25"
                        style={
                          program.accentColor
                            ? {
                                backgroundColor: normalizeHexColor(
                                  program.accentColor,
                                ),
                              }
                            : undefined
                        }
                        aria-hidden
                      />
                      <span className="truncate">{program.name}</span>
                    </span>
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionPanel className="space-y-2 pt-1">
                  <ul className="space-y-0.5">
                    {program.projects.map((proj) => {
                      const active =
                        pathname === proj.href ||
                        (proj.href !== "/inbox" &&
                          pathname.startsWith(`${proj.href}/`));
                      return (
                        <li key={proj.id}>
                          <Link
                            href={proj.href}
                            onClick={onNavigate}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm transition-colors",
                              active
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            )}
                          >
                            <span className="min-w-0 truncate">{proj.name}</span>
                            <span className="text-muted-foreground bg-background shrink-0 rounded px-1.5 py-0.5 text-xs tabular-nums ring-1 ring-border">
                              {proj.openTaskCount}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  {program.isInboxProgram ? (
                    <div className="border-border space-y-1 border-t pt-2">
                      <p className="text-muted-foreground px-1 text-xs font-medium">
                        未割り当てのタスク
                      </p>
                      <p className="text-muted-foreground px-1 text-[0.7rem] leading-snug">
                        プロジェクトへ移動すると整理済みになります。
                      </p>
                      {program.inboxOpenTasks.length === 0 ? (
                        <p className="text-muted-foreground px-2 py-1 text-xs">
                          なし
                        </p>
                      ) : (
                        <ul className="max-h-48 space-y-0.5 overflow-y-auto">
                          {program.inboxOpenTasks.map((t) => (
                            <li key={t.id}>
                              <Link
                                href={`/inbox/tasks/${t.id}/edit`}
                                onClick={onNavigate}
                                className="text-foreground block truncate rounded-md px-2 py-1 text-xs hover:bg-muted/60"
                              >
                                {t.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      ) : null}
    </div>
  );
}
