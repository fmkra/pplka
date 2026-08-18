CREATE OR REPLACE FUNCTION "nauka-ppla_set_updated_at"()
RETURNS trigger AS $$
BEGIN
	IF NEW IS DISTINCT FROM OLD THEN
		NEW."updatedAt" = CURRENT_TIMESTAMP;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER "category_set_updated_at"
BEFORE UPDATE ON "nauka-ppla_category"
FOR EACH ROW EXECUTE FUNCTION "nauka-ppla_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "explanation_set_updated_at"
BEFORE UPDATE ON "nauka-ppla_explanation"
FOR EACH ROW EXECUTE FUNCTION "nauka-ppla_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "knowledge_base_node_set_updated_at"
BEFORE UPDATE ON "nauka-ppla_knowledge_base_node"
FOR EACH ROW EXECUTE FUNCTION "nauka-ppla_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "license_set_updated_at"
BEFORE UPDATE ON "nauka-ppla_license"
FOR EACH ROW EXECUTE FUNCTION "nauka-ppla_set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "question_set_updated_at"
BEFORE UPDATE ON "nauka-ppla_question"
FOR EACH ROW EXECUTE FUNCTION "nauka-ppla_set_updated_at"();
