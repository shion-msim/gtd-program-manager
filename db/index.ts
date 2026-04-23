import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("環境変数 DATABASE_URL を設定してください（Neon 接続文字列）。");
}

const client = neon(databaseUrl);

export const db = drizzle(client, { schema });
