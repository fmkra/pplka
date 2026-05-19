CREATE TABLE "nauka-ppla_question_comment" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"questionId" varchar(255) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"displayName" varchar(100),
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nauka-ppla_question_comment" ADD CONSTRAINT "nauka-ppla_question_comment_questionId_nauka-ppla_question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."nauka-ppla_question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nauka-ppla_question_comment" ADD CONSTRAINT "nauka-ppla_question_comment_userId_nauka-ppla_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."nauka-ppla_user"("id") ON DELETE no action ON UPDATE no action;