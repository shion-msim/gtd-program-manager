import { test, expect } from "@playwright/test";
import { loginAsE2e } from "./helpers";

const canRunE2E =
  Boolean(process.env.DATABASE_URL) && Boolean(process.env.AUTH_SECRET);

const describeE2E = canRunE2E
  ? test.describe
  : test.describe.skip;

describeE2E("MVP E2E（E2E 認証＋DB。DATABASE_URL + AUTH_SECRET 必須）", () => {

  test("A: ダッシュボードの主要見出し", async ({ page }) => {
    await loginAsE2e(page);
    await expect(
      page.getByRole("heading", { name: "ダッシュボード" }),
    ).toBeVisible();
    await expect(page.getByTestId("dashboard-greeting")).toBeVisible();
  });

  test("B: Inbox にタスクを追加", async ({ page }) => {
    await loginAsE2e(page);
    await page.goto("/inbox");
    const label = `e2e-inbox-${Date.now()}`;
    await page.getByPlaceholder("1 行でタスクを追加").fill(label);
    await page.getByRole("button", { name: "追加" }).click();
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  });

  test("C: タスクを別プロジェクトに移動", async ({ page }) => {
    await loginAsE2e(page);
    const req = page.context().request;
    const prog = await req.post("/api/programs", {
      data: { name: `E2E Program ${Date.now()}` },
    });
    expect(prog.ok()).toBeTruthy();
    const program = (await prog.json()) as { id: string };
    const proj = await req.post("/api/projects", {
      data: { programId: program.id, name: "E2E Project" },
    });
    expect(proj.ok()).toBeTruthy();
    const project = (await proj.json()) as { id: string };
    const task = await req.post("/api/tasks", { data: { title: "move-me" } });
    expect(task.ok()).toBeTruthy();
    const t = (await task.json()) as { id: string };
    const move = await req.patch(`/api/tasks/${t.id}`, {
      data: { projectId: project.id },
    });
    expect(move.ok()).toBeTruthy();
    const inbox = await req.get(
      "/api/tasks?" + new URLSearchParams({ projectId: project.id }).toString(),
    );
    const movedList = (await inbox.json()) as { id: string }[];
    const ids = movedList.map((x) => x.id);
    expect(ids).toContain(t.id);
  });

  test("D: タスクを完了", async ({ page }) => {
    await loginAsE2e(page);
    const req = page.context().request;
    const created = await req.post("/api/tasks", {
      data: { title: "done-test" },
    });
    expect(created.ok()).toBeTruthy();
    const t = (await created.json()) as { id: string };
    const patched = await req.patch(`/api/tasks/${t.id}`, {
      data: { status: "done" },
    });
    expect(patched.ok()).toBeTruthy();
    await page.goto("/inbox");
    await expect(page.getByText("done-test", { exact: true })).not.toBeVisible();
  });

  test("F: Inbox から UI で別プロジェクトへ移動", async ({ page }) => {
    await loginAsE2e(page);
    const req = page.context().request;
    const prog = await req.post("/api/programs", {
      data: { name: `E2E UI Move ${Date.now()}` },
    });
    expect(prog.ok()).toBeTruthy();
    const program = (await prog.json()) as { id: string };
    const proj = await req.post("/api/projects", {
      data: { programId: program.id, name: "E2E Move Target" },
    });
    expect(proj.ok()).toBeTruthy();
    const project = (await proj.json()) as { id: string };

    await page.goto("/inbox");
    const title = `e2e-ui-move-${Date.now()}`;
    await page.getByPlaceholder("1 行でタスクを追加").fill(title);
    await page.getByRole("button", { name: "追加" }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    const row = page
      .getByTestId("inbox-list")
      .locator("li")
      .filter({ hasText: title });
    await row.getByTestId("inbox-move-target").selectOption(project.id);
    await row.getByTestId("inbox-move-submit").click();

    await expect(page.getByText(title, { exact: true })).not.toBeVisible();
  });

  test("E: 負荷ビューで空でも破綻しない", async ({ page }) => {
    await loginAsE2e(page);
    await page.getByTestId("nav-workload").click();
    await expect(
      page.getByRole("heading", { name: "負荷（週次・〆切）" }),
    ).toBeVisible();
    await expect(page.getByText("6 週の件数")).toBeVisible();
  });

  test("G: プロジェクト画面でタスクを追加", async ({ page }) => {
    await loginAsE2e(page);
    const req = page.context().request;
    const prog = await req.post("/api/programs", {
      data: { name: `E2E Project Tasks ${Date.now()}` },
    });
    expect(prog.ok()).toBeTruthy();
    const program = (await prog.json()) as { id: string };
    const proj = await req.post("/api/projects", {
      data: { programId: program.id, name: "E2E Task Board" },
    });
    expect(proj.ok()).toBeTruthy();
    const project = (await proj.json()) as { id: string };

    await page.goto(`/projects/${project.id}`);
    await expect(
      page.getByRole("heading", { name: "E2E Task Board", level: 1 }),
    ).toBeVisible();

    const label = `e2e-project-task-${Date.now()}`;
    await page.getByPlaceholder("次の行動として追加").fill(label);
    await page.getByRole("button", { name: "追加" }).nth(0).click();
    await expect(
      page.getByTestId("project-tasks-open").getByText(label, { exact: true }),
    ).toBeVisible();
  });
});
