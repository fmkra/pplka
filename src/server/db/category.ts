import { unique } from "drizzle-orm/pg-core";
import { createTable } from "./_creator";
import { relations } from "drizzle-orm";
import { licenses } from "./license";
import { questionInstances } from "./question";

export const categories = createTable(
  "category",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 255 }).notNull(),
    url: d.varchar({ length: 255 }).notNull(),
    color: d.varchar({ length: 15 }),
    icon: d.varchar({ length: 255 }),
    description: d.text(),
    topics: d.text().array(),
    examTime: d.integer().notNull(), // in seconds
    examQuestionCount: d.integer().notNull(),
    licenseId: d.integer().references(() => licenses.id),
    createdAt: d
      .timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: d
      .timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  }),
  (t) => [unique().on(t.url, t.licenseId)],
);

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  questionInstances: many(questionInstances),
  license: one(licenses, {
    fields: [categories.licenseId],
    references: [licenses.id],
  }),
}));
