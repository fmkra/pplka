import { relations, sql } from "drizzle-orm";
import { createTable } from "./_creator";
import { users } from "./user";
import { categories } from "./category";
import { questionsToTags } from "./tag";
import { questionsToExplanations } from "./explanation";

export const questions = createTable("question", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  externalId: d.varchar({ length: 255 }),
  question: d.text().notNull(),
  answerCorrect: d.text().notNull(),
  answerIncorrect1: d.text().notNull(),
  answerIncorrect2: d.text().notNull(),
  answerIncorrect3: d.text().notNull(),
  createdBy: d.varchar({ length: 255 }).references(() => users.id),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  tags: many(questionsToTags),
  questionInstances: many(questionInstances),
  questionsToExplanations: many(questionsToExplanations),
}));

export const questionInstances = createTable("question_instance", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  categoryId: d
    .integer()
    .notNull()
    .references(() => categories.id),
  questionId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => questions.id),
}));

export const questionInstancesRelations = relations(
  questionInstances,
  ({ one }) => ({
    category: one(categories, {
      fields: [questionInstances.categoryId],
      references: [categories.id],
    }),
    question: one(questions, {
      fields: [questionInstances.questionId],
      references: [questions.id],
    }),
  }),
);
