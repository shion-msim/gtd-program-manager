import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DIRECT_URL または DATABASE_URL がありません。");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();

  const pCol = await client.query(
    "select column_name from information_schema.columns where table_schema = $1 and table_name = $2 and column_name = $3",
    ["public", "projects", "nav_sort_index"],
  );
  const prCol = await client.query(
    "select column_name from information_schema.columns where table_schema = $1 and table_name = $2 and column_name = $3",
    ["public", "programs", "nav_sort_index"],
  );
  console.log("projects.nav_sort_index:", pCol.rows);
  console.log("programs.nav_sort_index:", prCol.rows);

  const migTry = async (q) => {
    try {
      return await client.query(q);
    } catch (e) {
      return { error: `${e.code ?? ""} ${e.message}` };
    }
  };

  const m =
    await migTry(
      'select id, hash, created_at from "__drizzle_migrations" order by created_at desc limit 8',
    );
  console.log("__drizzle_migrations (__quoted):", m.rows ?? m.error);

  const m2 =
    await migTry(
      "select id, hash, created_at from __drizzle_migrations order by created_at desc limit 8",
    );
  console.log("__drizzle_migrations (unquoted):", m2.rows ?? m2.error);

  await client.end();
  process.exit(0);
} catch (e) {
  console.error("接続またはクエリ失敗:", e.code, e.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
}
