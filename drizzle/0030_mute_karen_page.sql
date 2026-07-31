ALTER TABLE "nauka-ppla_learning_category" ADD COLUMN "createdAt" timestamp with time zone;--> statement-breakpoint
UPDATE "nauka-ppla_learning_category" AS "learningCategory"
SET "createdAt" = COALESCE(
	"learningCategory"."deletedAt",
	(
		SELECT min("activity"."day")::timestamp with time zone
		FROM "nauka-ppla_learning_activity" AS "activity"
		WHERE "activity"."userId" = "learningCategory"."userId"
			AND "activity"."categoryId" = "learningCategory"."categoryId"
	),
	now()
);--> statement-breakpoint
ALTER TABLE "nauka-ppla_learning_category" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "nauka-ppla_learning_category" ALTER COLUMN "createdAt" SET NOT NULL;
