import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";

import * as user from "./user";
import * as question from "./question";
import * as tag from "./tag";
import * as learning from "./learning";
import * as category from "./category";
import * as license from "./license";
import * as exam from "./exam";
import * as explanation from "./explanation";
import * as knowledgeBase from "./knowledgeBase";
import { createTable } from "./_creator";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, {
  schema: {
    createTable,
    ...user,
    ...question,
    ...tag,
    ...learning,
    ...category,
    ...license,
    ...exam,
    ...explanation,
    ...knowledgeBase,
  },
});
