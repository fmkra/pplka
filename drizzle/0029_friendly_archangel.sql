CREATE TABLE "nauka-ppla_learning_activity" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"categoryId" integer NOT NULL,
	"day" date NOT NULL
);
--> statement-breakpoint
DROP INDEX "nauka-ppla_learning_category_userId_categoryId_index";--> statement-breakpoint
ALTER TABLE "nauka-ppla_learning_category" ADD COLUMN "deletedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "nauka-ppla_user" ADD COLUMN "registeredAt" timestamp with time zone;--> statement-breakpoint
UPDATE "nauka-ppla_user" SET "registeredAt" = "emailVerified" WHERE "emailVerified" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "nauka-ppla_user" ALTER COLUMN "registeredAt" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "nauka-ppla_learning_activity" ADD CONSTRAINT "nauka-ppla_learning_activity_userId_nauka-ppla_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."nauka-ppla_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nauka-ppla_learning_activity" ADD CONSTRAINT "nauka-ppla_learning_activity_categoryId_nauka-ppla_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."nauka-ppla_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nauka-ppla_learning_activity_userId_categoryId_day_index" ON "nauka-ppla_learning_activity" USING btree ("userId","categoryId","day");--> statement-breakpoint
CREATE INDEX "learning_activity_day_user_idx" ON "nauka-ppla_learning_activity" USING btree ("day","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_category_active_user_category_idx" ON "nauka-ppla_learning_category" USING btree ("userId","categoryId") WHERE "nauka-ppla_learning_category"."deletedAt" is null;
