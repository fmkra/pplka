CREATE TABLE "nauka-ppla_content_feedback" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"questionId" varchar(255),
	"knowledgeBaseNodeId" varchar(255),
	"userId" varchar(255),
	"rating" integer NOT NULL,
	"details" text,
	"submittedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "content_feedback_one_target" CHECK (("nauka-ppla_content_feedback"."questionId" is not null and "nauka-ppla_content_feedback"."knowledgeBaseNodeId" is null) or ("nauka-ppla_content_feedback"."questionId" is null and "nauka-ppla_content_feedback"."knowledgeBaseNodeId" is not null))
);
--> statement-breakpoint
ALTER TABLE "nauka-ppla_content_feedback" ADD CONSTRAINT "nauka-ppla_content_feedback_questionId_nauka-ppla_question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."nauka-ppla_question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nauka-ppla_content_feedback" ADD CONSTRAINT "nauka-ppla_content_feedback_knowledgeBaseNodeId_nauka-ppla_knowledge_base_node_id_fk" FOREIGN KEY ("knowledgeBaseNodeId") REFERENCES "public"."nauka-ppla_knowledge_base_node"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nauka-ppla_content_feedback" ADD CONSTRAINT "nauka-ppla_content_feedback_userId_nauka-ppla_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."nauka-ppla_user"("id") ON DELETE no action ON UPDATE no action;