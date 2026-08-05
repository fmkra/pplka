import { sql } from "drizzle-orm";
import { createTable } from "./_creator";

export const buyCoffeeBannerImpressions = createTable(
  "buy_coffee_banner_impression",
  (d) => ({
    id: d.varchar({ length: 36 }).primaryKey(),
    dismissalCount: d.integer().notNull(),
    pathname: d.varchar({ length: 255 }).notNull(),
    shownAt: d
      .timestamp({ withTimezone: true, mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  }),
);

export type BuyCoffeeBannerImpression =
  typeof buyCoffeeBannerImpressions.$inferSelect;
