import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

// drizzle-kit は `pg` を最優先。Neon プール + serverless 由来の 42P02 回避用に DIRECT_URL（直結）を優先
const drizzleUrl =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!drizzleUrl) {
  throw new Error(
    "drizzle-kit: .env.local に DIRECT_URL または DATABASE_URL を設定してください。プール接続で 42P02 になる場合は Neon の直結接続文字列を DIRECT_URL に指定してください。",
  );
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: drizzleUrl,
  },
});
