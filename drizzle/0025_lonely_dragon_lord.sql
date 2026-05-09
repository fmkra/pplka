ALTER TABLE "nauka-ppla_knowledge_base_node" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "nauka-ppla_knowledge_base_node"
SET "slug" = "id"
WHERE "type" = 'file';--> statement-breakpoint
CREATE UNIQUE INDEX "kb_node_slug_idx" ON "nauka-ppla_knowledge_base_node" USING btree ("slug");
