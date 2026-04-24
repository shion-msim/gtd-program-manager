CREATE TABLE "user_app_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"priority_colors_json" text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
DROP INDEX "projects_one_inbox_per_user";--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "accent_color" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "accent_color" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_app_settings" ADD CONSTRAINT "user_app_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_one_inbox_per_user" ON "projects" USING btree ("user_id") WHERE "projects"."is_inbox" = true;