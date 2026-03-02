import { relations } from "drizzle-orm";
import { uniqueIndex } from "drizzle-orm/pg-core";
import { createTable } from "./_creator";
import { questions } from "./question";

export const explanations = createTable("explanation", (d) => ({
  id: d
    .varchar({ length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  explanation: d.text().notNull(),
}));

export const questionsToExplanations = createTable(
  "question_to_explanation",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    questionId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => questions.id),
    explanationId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => explanations.id),
    order: d.integer().notNull().default(0),
  }),
  (t) => [uniqueIndex("qte_question_order_idx").on(t.questionId, t.order)],
);

export const questionsToExplanationsRelations = relations(
  questionsToExplanations,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionsToExplanations.questionId],
      references: [questions.id],
    }),
    explanation: one(explanations, {
      fields: [questionsToExplanations.explanationId],
      references: [explanations.id],
    }),
  }),
);

export const explanationsRelations = relations(explanations, ({ many }) => ({
  questionsToExplanations: many(questionsToExplanations),
}));
