import "server-only";

import { max, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { contentRevisions } from "~/server/db/contentRevision";

export type ContentRevisionInput = {
  path: string;
  source: string;
  revision: string;
  updatedAt: Date;
};

export async function recordContentRevisions(
  revisions: ContentRevisionInput[],
) {
  if (revisions.length === 0) return;

  await db.transaction(async (transaction) => {
    for (const revision of revisions) {
      await transaction
        .insert(contentRevisions)
        .values(revision)
        .onConflictDoUpdate({
          target: [contentRevisions.path, contentRevisions.source],
          set: {
            revision: revision.revision,
            updatedAt: revision.updatedAt,
          },
          setWhere: sql`${contentRevisions.revision} is distinct from ${revision.revision}`,
        });
    }
  });
}

export async function getLatestContentRevisions() {
  const rows = await db
    .select({
      path: contentRevisions.path,
      updatedAt: max(contentRevisions.updatedAt),
    })
    .from(contentRevisions)
    .groupBy(contentRevisions.path);

  return new Map(
    rows.flatMap(({ path, updatedAt }) => {
      if (!updatedAt) return [];
      return [[path, new Date(updatedAt)] as const];
    }),
  );
}
