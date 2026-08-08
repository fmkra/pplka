import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "~/server/db";
import { categories } from "~/server/db/category";
import { questionInstances, questions } from "~/server/db/question";
import { explanations, questionsToExplanations } from "~/server/db/explanation";
import { licenses } from "~/server/db/license";

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

export const getQuestionPageData = cache(async (questionId: string) => {
  const [question, contexts, questionExplanations] = await Promise.all([
    db.query.questions.findFirst({
      where: eq(questions.id, questionId),
    }),
    db
      .select({
        category: categories,
        licenseUrl: licenses.url,
      })
      .from(questionInstances)
      .innerJoin(categories, eq(questionInstances.categoryId, categories.id))
      .innerJoin(licenses, eq(categories.licenseId, licenses.id))
      .where(eq(questionInstances.questionId, questionId))
      .orderBy(asc(licenses.id), asc(categories.id)),
    db
      .select({
        explanation: explanations,
        isExtraResource: questionsToExplanations.isExtraResource,
      })
      .from(questionsToExplanations)
      .innerJoin(
        explanations,
        eq(questionsToExplanations.explanationId, explanations.id),
      )
      .where(eq(questionsToExplanations.questionId, questionId))
      .orderBy(
        asc(questionsToExplanations.isExtraResource),
        asc(questionsToExplanations.order),
      ),
  ]);

  if (!question || contexts.length === 0) return null;

  return { question, contexts, explanations: questionExplanations };
});

export async function getAllQuestionIds() {
  return db.select({ question_id: questions.id }).from(questions);
}
