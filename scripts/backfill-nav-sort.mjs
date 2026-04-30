/**
 * drizzle-kit push で列だけ追加済み／migrate が使えない環境向け。
 * nav_sort_index をユーザー・プログラム単位で初期化します。
 */
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DIRECT_URL または DATABASE_URL がありません。");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, "backfill-nav-sort.sql");

const client = new pg.Client({ connectionString: url });

const sqlTemplate = await fs.readFile(sqlPath, "utf8");

try {
  await client.connect();

  /** トランザクション内ではまとめて実行 */
  await client.query("BEGIN");
  await client.query(sqlTemplate);
  await client.query("COMMIT");
  console.log("backfill-nav-sort: OK");
  await client.end();
  process.exit(0);
} catch (e) {
  console.error("backfill-nav-sort: FAILED:", e.code, e.message);
  try {
    await client.query("ROLLBACK");
  } catch {}
  try {
    await client.end();
  } catch {}
  process.exit(1);
}
