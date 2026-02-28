CREATE TABLE "nauka-ppla_question_to_explanation" (
	"questionId" varchar(255) NOT NULL,
	"explanationId" varchar(255) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nauka-ppla_kb_node_to_explanation" (
	"knowledgeBaseNodeId" varchar(255) NOT NULL,
	"explanationId" varchar(255) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" DROP CONSTRAINT "nauka-ppla_explanation_questionId_nauka-ppla_question_id_fk";
--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" DROP CONSTRAINT "nauka-ppla_explanation_knowledgeBaseNodeId_nauka-ppla_knowledge_base_node_id_fk";
--> statement-breakpoint
DROP INDEX "explanation_question_order_idx";--> statement-breakpoint
DROP INDEX "explanation_kb_node_order_idx";--> statement-breakpoint
ALTER TABLE "nauka-ppla_question_to_explanation" ADD CONSTRAINT "nauka-ppla_question_to_explanation_questionId_nauka-ppla_question_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."nauka-ppla_question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nauka-ppla_question_to_explanation" ADD CONSTRAINT "nauka-ppla_question_to_explanation_explanationId_nauka-ppla_explanation_id_fk" FOREIGN KEY ("explanationId") REFERENCES "public"."nauka-ppla_explanation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nauka-ppla_kb_node_to_explanation" ADD CONSTRAINT "nauka-ppla_kb_node_to_explanation_knowledgeBaseNodeId_nauka-ppla_knowledge_base_node_id_fk" FOREIGN KEY ("knowledgeBaseNodeId") REFERENCES "public"."nauka-ppla_knowledge_base_node"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nauka-ppla_kb_node_to_explanation" ADD CONSTRAINT "nauka-ppla_kb_node_to_explanation_explanationId_nauka-ppla_explanation_id_fk" FOREIGN KEY ("explanationId") REFERENCES "public"."nauka-ppla_explanation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "qte_question_order_idx" ON "nauka-ppla_question_to_explanation" USING btree ("questionId","order");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_node_explanation_order_idx" ON "nauka-ppla_kb_node_to_explanation" USING btree ("knowledgeBaseNodeId","order");--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" DROP COLUMN "questionId";--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" DROP COLUMN "knowledgeBaseNodeId";--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" DROP COLUMN "order";