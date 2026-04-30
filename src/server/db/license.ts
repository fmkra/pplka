import { createTable } from "./_creator";

export const licenses = createTable("license", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 255 }).notNull(),
  url: d.varchar({ length: 255 }).notNull().unique(),
  icon: d.varchar({ length: 255 }),
  description: d.text(),
  version: d.integer().notNull().default(1),
}));
