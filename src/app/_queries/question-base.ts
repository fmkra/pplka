import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { categories } from "~/server/db/category";
import { questionInstances, questions } from "~/server/db/question";
import { questionsToExplanations } from "~/server/db/explanation";

export async function getQuestionForLicense(
  questionId: string,
  licenseId: number,
) {
  const [row] = await db
    .select({
      question: questions,
      categoryId: questionInstances.categoryId,
      hasExplanation: sql<boolean>`exists(
        select 1 from ${questionsToExplanations}
        where ${questionsToExplanations.questionId} = ${questions.id}
      )`.as("has_explanation"),
    })
    .from(questions)
    .innerJoin(
      questionInstances,
      eq(questions.id, questionInstances.questionId),
    )
    .innerJoin(categories, eq(questionInstances.categoryId, categories.id))
    .where(
      and(eq(questions.id, questionId), eq(categories.licenseId, licenseId)),
    )
    .limit(1);

  return row;
}
