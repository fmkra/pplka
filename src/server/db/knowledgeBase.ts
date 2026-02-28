import { relations, sql } from "drizzle-orm";
import { uniqueIndex } from "drizzle-orm/pg-core";
import { createTable } from "./_creator";
import { explanations } from "./explanation";

export const knowledgeBaseNodes = createTable(
  "knowledge_base_node",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.text().notNull(),
    type: d.text({ enum: ["folder", "file"] }).notNull(),
    parentId: d.varchar({ length: 255 }),
    order: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`),
  }),
  (t) => [
    uniqueIndex("kb_node_parent_order_idx").on(t.parentId, t.order),
  ],
);

export const knowledgeBaseNodesToExplanations = createTable(
  "kb_node_to_explanation",
  (d) => ({
    knowledgeBaseNodeId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => knowledgeBaseNodes.id),
    explanationId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => explanations.id),
    order: d.integer().notNull().default(0),
  }),
  (t) => [
    uniqueIndex("kb_node_explanation_order_idx").on(
      t.knowledgeBaseNodeId,
      t.order,
    ),
  ],
);

export const knowledgeBaseNodesRelations = relations(
  knowledgeBaseNodes,
  ({ one, many }) => ({
    parent: one(knowledgeBaseNodes, {
      fields: [knowledgeBaseNodes.parentId],
      references: [knowledgeBaseNodes.id],
      relationName: "parentChild",
    }),
    children: many(knowledgeBaseNodes, {
      relationName: "parentChild",
    }),
    knowledgeBaseNodesToExplanations: many(knowledgeBaseNodesToExplanations),
  }),
);

export const knowledgeBaseNodesToExplanationsRelations = relations(
  knowledgeBaseNodesToExplanations,
  ({ one }) => ({
    knowledgeBaseNode: one(knowledgeBaseNodes, {
      fields: [knowledgeBaseNodesToExplanations.knowledgeBaseNodeId],
      references: [knowledgeBaseNodes.id],
    }),
    explanation: one(explanations, {
      fields: [knowledgeBaseNodesToExplanations.explanationId],
      references: [explanations.id],
    }),
  }),
);
