WITH inbox_program_ids AS (
	SELECT DISTINCT "program_id"
	FROM "projects"
	WHERE "is_inbox" = true
),
ord AS (
	SELECT
		pr."id",
		(ROW_NUMBER() OVER (
			PARTITION BY pr."user_id"
			ORDER BY
				CASE WHEN ip."program_id" IS NOT NULL THEN 0 ELSE 1 END ASC,
				pr."created_at" DESC
		) - 1)::integer AS idx
	FROM "programs" pr
	LEFT JOIN inbox_program_ids ip ON ip."program_id" = pr."id"
)
UPDATE "programs" p
SET nav_sort_index = ord.idx
FROM ord
WHERE p."id" = ord.id;

WITH ord AS (
	SELECT
		p."id",
		(ROW_NUMBER() OVER (
			PARTITION BY p."program_id"
			ORDER BY CASE WHEN p."is_inbox" THEN 0 ELSE 1 END ASC, p."name" ASC
		) - 1)::integer AS idx
	FROM "projects" p
)
UPDATE "projects" p
SET nav_sort_index = ord.idx
FROM ord
WHERE p."id" = ord.id;
