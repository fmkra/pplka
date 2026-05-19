import { relations, sql } from "drizzle-orm";
import { createTable } from "./_creator";
import { questions } from "./question";
import { users } from "./user";

export const questionComments = createTable("question_comment", (d) => ({
  id: d
    .varchar({ length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  questionId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => questions.id),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id),
  displayName: d.varchar({ length: 100 }),
  content: d.text().notNull(),
  createdAt: d
    .timestamp({ withTimezone: true, mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}));

export const questionCommentsRelations = relations(
  questionComments,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionComments.questionId],
      references: [questions.id],
    }),
    user: one(users, {
      fields: [questionComments.userId],
      references: [users.id],
    }),
  }),
);

export type QuestionComment = typeof questionComments.$inferSelect;
