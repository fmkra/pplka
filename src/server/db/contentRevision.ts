import { index, primaryKey } from "drizzle-orm/pg-core";
import { createTable } from "./_creator";

/**
 * Effective modification dates for public pages.
 *
 * A page can be influenced by more than one content source. Each source keeps
 * its own idempotent revision, while sitemap generation uses the newest date
 * across all sources for a path.
 */
export const contentRevisions = createTable(
  "content_revision",
  (d) => ({
    path: d.text().notNull(),
    source: d.varchar({ length: 64 }).notNull(),
    revision: d.varchar({ length: 128 }).notNull(),
    updatedAt: d.timestamp({ withTimezone: true, mode: "date" }).notNull(),
  }),
  (table) => [
    primaryKey({ columns: [table.path, table.source] }),
    index("content_revision_path_idx").on(table.path),
  ],
);
