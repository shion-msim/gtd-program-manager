import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  accountsTable,
  authenticatorsTable,
  sessionsTable,
  usersTable,
  verificationTokensTable,
} from "./auth-tables";

export {
  accountsTable,
  authenticatorsTable,
  sessionsTable,
  usersTable,
  verificationTokensTable,
};

export const programs = pgTable(
  "programs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** カード左端などに使う #RRGGBB。未設定は null */
    accentColor: text("accent_color"),
    startOn: date("start_on"),
    endOn: date("end_on"),
    /** ナビ・一覧の並び（小さいほど上）。受信箱プログラムは常に 0 を想定 */
    navSortIndex: integer("nav_sort_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("programs_user_id_idx").on(t.userId)],
);

export const projects = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    accentColor: text("accent_color"),
    isInbox: boolean("is_inbox").notNull().default(false),
    /** 同一プログラム内の並び（小さいほど上）。Inbox は常に 0 を想定 */
    navSortIndex: integer("nav_sort_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("projects_program_id_idx").on(t.programId),
    uniqueIndex("projects_one_inbox_per_user")
      .on(t.userId)
      // CREATE INDEX ... WHERE では $1 バインド不可のため、true はリテラル SQL にする
      .where(sql`${t.isInbox} = true`),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: text("status").notNull(),
    /** none | low | medium | high */
    priority: text("priority").notNull().default("none"),
    dueOn: date("due_on"),
    note: text("note"),
    sortOrder: integer("sort_order"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("tasks_project_id_idx").on(t.projectId)],
);

export const programsRelations = relations(programs, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [programs.userId],
    references: [usersTable.id],
  }),
  projectList: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [projects.userId],
    references: [usersTable.id],
  }),
  program: one(programs, {
    fields: [projects.programId],
    references: [programs.id],
  }),
  taskList: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

/** 優先度キーごとの色（JSON オブジェクト）をユーザー単位で保持 */
export const userAppSettings = pgTable("user_app_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  priorityColorsJson: text("priority_colors_json").notNull().default("{}"),
});
