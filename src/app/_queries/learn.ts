import "server-only";

import { count, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { categories } from "~/server/db/category";
import { questionInstances } from "~/server/db/question";

export const getCategoriesWithQuestionCount = (licenseId: number) =>
  db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      url: categories.url,
      description: categories.description,
      icon: categories.icon,
      topics: categories.topics,
      questionCount: count(questionInstances.id),
    })
    .from(categories)
    .leftJoin(
      questionInstances,
      eq(categories.id, questionInstances.categoryId),
    )
    .where(eq(categories.licenseId, licenseId))
    .groupBy(categories.id)
    .orderBy(categories.id);
