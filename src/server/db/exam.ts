import { index, pgEnum } from "drizzle-orm/pg-core";
import { categories } from "./category";
import { createTable } from "./_creator";
import { users } from "./user";
import { questionInstances } from "./question";
import { relations } from "drizzle-orm";

export const answerEnum = pgEnum("answer", ["A", "B", "C", "D"]);

export const examAttempt = createTable(
  "exam_attempt",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    categoryId: d
      .integer()
      .notNull()
      .references(() => categories.id),
    startedAt: d.timestamp().notNull().defaultNow(),
    deadlineTime: d.timestamp().notNull(),
    finishedAt: d.timestamp(),
  }),
  (t) => [
    index("exam_attempt_user_category_started_idx").on(
      t.userId,
      t.categoryId,
      t.startedAt,
    ),
  ],
);

export const examQuestions = createTable(
  "exam_questions",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    examAttemptId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => examAttempt.id),
    questionInstanceId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => questionInstances.id),
    answer: answerEnum(),
  }),
  (t) => [index("exam_questions_attempt_idx").on(t.examAttemptId)],
);

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  questionInstance: one(questionInstances, {
    fields: [examQuestions.questionInstanceId],
    references: [questionInstances.id],
  }),
}));
