import z from "zod";
import { createTRPCRouter, noSessionProcedure } from "../trpc";
import { explanations, questionsToExplanations } from "~/server/db/explanation";
import { eq, isNull, asc, desc, countDistinct } from "drizzle-orm";
import {
  knowledgeBaseNodes,
  knowledgeBaseNodesToExplanations,
} from "~/server/db/knowledgeBase";
import { questionInstances } from "~/server/db/question";
import { categories } from "~/server/db/category";
import { db } from "~/server/db";
import { licenses } from "~/server/db/license";

export const explanationRouter = createTRPCRouter({
  getExplanations: noSessionProcedure
    .input(
      z.object({
        questionId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select({
          explanation: explanations,
          isExtraResource: questionsToExplanations.isExtraResource,
        })
        .from(explanations)
        .innerJoin(
          questionsToExplanations,
          eq(explanations.id, questionsToExplanations.explanationId),
        )
        .where(eq(questionsToExplanations.questionId, input.questionId))
        .orderBy(
          desc(questionsToExplanations.isExtraResource),
          asc(questionsToExplanations.order),
        );
    }),

  getKnowledgeBaseNodes: noSessionProcedure
    .input(z.object({ parentId: z.string().nullable() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select({
          node: knowledgeBaseNodes,
        })
        .from(knowledgeBaseNodes)
        .where(
          input.parentId !== null
            ? eq(knowledgeBaseNodes.parentId, input.parentId)
            : isNull(knowledgeBaseNodes.parentId),
        );
    }),
});

export async function getKnowledgeBaseNodeData(id: string) {
  const query1 = db
    .select()
    .from(explanations)
    .innerJoin(
      knowledgeBaseNodesToExplanations,
      eq(explanations.id, knowledgeBaseNodesToExplanations.explanationId),
    )
    .where(eq(knowledgeBaseNodesToExplanations.knowledgeBaseNodeId, id))
    .orderBy(asc(knowledgeBaseNodesToExplanations.order));
  const query2 = db
    .select({
      licenseUrl: licenses.url,
      questionCount: countDistinct(questionsToExplanations.questionId),
    })
    .from(knowledgeBaseNodesToExplanations)
    .innerJoin(
      questionsToExplanations,
      eq(
        knowledgeBaseNodesToExplanations.explanationId,
        questionsToExplanations.explanationId,
      ),
    )
    .innerJoin(
      questionInstances,
      eq(questionsToExplanations.questionId, questionInstances.questionId),
    )
    .innerJoin(categories, eq(questionInstances.categoryId, categories.id))
    .innerJoin(licenses, eq(categories.licenseId, licenses.id))
    .where(eq(knowledgeBaseNodesToExplanations.knowledgeBaseNodeId, id))
    .groupBy(licenses.url);

  const [query1Result, query2Result] = await Promise.all([query1, query2]);

  return {
    explanations: query1Result,
    questionCounts: Object.fromEntries(
      query2Result.map(({ licenseUrl, questionCount }) => [
        licenseUrl,
        questionCount,
      ]),
    ),
  };
}
export type KnowledgeBaseNode = typeof knowledgeBaseNodes.$inferSelect;
