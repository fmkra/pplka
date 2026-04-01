import { relations, sql } from "drizzle-orm";
import { check } from "drizzle-orm/pg-core";
import { createTable } from "./_creator";
import { questions } from "./question";
import { knowledgeBaseNodes } from "./knowledgeBase";
import { users } from "./user";

export const contentFeedback = createTable(
  "content_feedback",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    questionId: d
      .varchar({ length: 255 })
      .references(() => questions.id),
    knowledgeBaseNodeId: d
      .varchar({ length: 255 })
      .references(() => knowledgeBaseNodes.id),
    userId: d.varchar({ length: 255 }).references(() => users.id),
    rating: d.integer().notNull(),
    details: d.text(),
    submittedAt: d
      .timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  }),
  (t) => [
    check(
      "content_feedback_one_target",
      sql`(${t.questionId} is not null and ${t.knowledgeBaseNodeId} is null) or (${t.questionId} is null and ${t.knowledgeBaseNodeId} is not null)`,
    ),
  ],
);

export const contentFeedbackRelations = relations(contentFeedback, ({ one }) => ({
  question: one(questions, {
    fields: [contentFeedback.questionId],
    references: [questions.id],
  }),
  knowledgeBaseNode: one(knowledgeBaseNodes, {
    fields: [contentFeedback.knowledgeBaseNodeId],
    references: [knowledgeBaseNodes.id],
  }),
  user: one(users, {
    fields: [contentFeedback.userId],
    references: [users.id],
  }),
}));

export type ContentFeedback = typeof contentFeedback.$inferSelect;
