CREATE TABLE "nauka-ppla_knowledge_base_node" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"parentId" varchar(255),
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "nauka-ppla_question" DROP CONSTRAINT "nauka-ppla_question_explanationId_nauka-ppla_explanation_id_fk";
--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" ADD COLUMN "questionId" varchar(255);--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" ADD COLUMN "knowledgeBaseNodeId" varchar(255);--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "kb_node_parent_order_idx" ON "nauka-ppla_knowledge_base_node" USING btree ("parentId","order");--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" ADD CONSTRAINT "nauka-ppla_explanation_questionId_nauka-ppla_question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."nauka-ppla_question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" ADD CONSTRAINT "nauka-ppla_explanation_knowledgeBaseNodeId_nauka-ppla_knowledge_base_node_id_fk" FOREIGN KEY ("knowledgeBaseNodeId") REFERENCES "public"."nauka-ppla_knowledge_base_node"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "explanation_question_order_idx" ON "nauka-ppla_explanation" USING btree ("questionId","order");--> statement-breakpoint
CREATE UNIQUE INDEX "explanation_kb_node_order_idx" ON "nauka-ppla_explanation" USING btree ("knowledgeBaseNodeId","order");--> statement-breakpoint
ALTER TABLE "nauka-ppla_question" DROP COLUMN "explanationId";