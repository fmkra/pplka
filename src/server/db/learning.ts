import { relations, sql } from "drizzle-orm";
import { index, uniqueIndex } from "drizzle-orm/pg-core";
import { createTable } from "./_creator";
import { users } from "./user";
import { questionInstances } from "./question";
import { categories } from "./category";

// Represents progress of learning a given question by the user
export const learningProgress = createTable(
  "learning_progress",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    questionInstanceId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => questionInstances.id),
    latestAttempt: d.integer().notNull(),
    random: d.doublePrecision().notNull(),
    isDone: d.boolean().notNull(),
    correctCount: d.integer().notNull(),
    incorrectCount: d.integer().notNull(),
  }),
  (table) => [uniqueIndex().on(table.userId, table.questionInstanceId)],
);

export const learningProgressRelations = relations(
  learningProgress,
  ({ one }) => ({
    questionInstance: one(questionInstances, {
      fields: [learningProgress.questionInstanceId],
      references: [questionInstances.id],
    }),
  }),
);

// Represents progress of learning a given category by the user.
// For now it is only useful to get which attempt the user is currently on.
// Rest of the data is stored in the learningProgress table.
export const learningCategory = createTable(
  "learning_category",
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
    latestAttempt: d.integer().notNull(),
    createdAt: d
      .timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: d.timestamp({ mode: "date", withTimezone: true }),
  }),
  (table) => [
    uniqueIndex("learning_category_active_user_category_idx")
      .on(table.userId, table.categoryId)
      .where(sql`${table.deletedAt} is null`),
  ],
);

// One row per device-observed day of learning. The unique index makes repeated
// reports (including reports from multiple devices) idempotent.
export const learningActivity = createTable(
  "learning_activity",
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
    day: d.date({ mode: "string" }).notNull(),
  }),
  (table) => [
    uniqueIndex().on(table.userId, table.categoryId, table.day),
    index("learning_activity_day_user_idx").on(table.day, table.userId),
  ],
);
