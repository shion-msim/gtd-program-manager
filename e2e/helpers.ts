import type { Page } from "@playwright/test";

const e2eSecret = () =>
  process.env.E2E_AUTH_SECRET ?? "playwright-default-e2e-secret";

export async function loginAsE2e(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E2E シークレット").fill(e2eSecret());
  await page.getByRole("button", { name: "E2E ログイン" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}
