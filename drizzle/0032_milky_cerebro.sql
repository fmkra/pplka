CREATE TABLE "nauka-ppla_content_revision" (
	"path" text NOT NULL,
	"source" varchar(64) NOT NULL,
	"revision" varchar(128) NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "nauka-ppla_content_revision_path_source_pk" PRIMARY KEY("path","source")
);
--> statement-breakpoint
ALTER TABLE "nauka-ppla_category" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "nauka-ppla_category" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "nauka-ppla_explanation" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "nauka-ppla_knowledge_base_node" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "nauka-ppla_license" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "nauka-ppla_license" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "nauka-ppla_question" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "content_revision_path_idx" ON "nauka-ppla_content_revision" USING btree ("path");
