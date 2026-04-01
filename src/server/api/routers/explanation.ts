import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { explanations, questionsToExplanations } from "~/server/db/explanation";
import { eq, isNull, asc, desc, count, and } from "drizzle-orm";
import {
  knowledgeBaseNodes,
  knowledgeBaseNodesToExplanations,
} from "~/server/db/knowledgeBase";
import { questionInstances } from "~/server/db/question";
import { categories } from "~/server/db/category";

export const explanationRouter = createTRPCRouter({
  getExplanations: publicProcedure
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

  getKnowledgeBaseNodes: publicProcedure
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

  getExplanationsForKnowledgeBaseNode: publicProcedure
    .input(z.object({ id: z.string(), licenseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const query1 = ctx.db
        .select()
        .from(explanations)
        .innerJoin(
          knowledgeBaseNodesToExplanations,
          eq(explanations.id, knowledgeBaseNodesToExplanations.explanationId),
        )
        .where(
          eq(knowledgeBaseNodesToExplanations.knowledgeBaseNodeId, input.id),
        )
        .orderBy(asc(knowledgeBaseNodesToExplanations.order));
      const query2 = ctx.db
        .select({
          questionCount: count(questionsToExplanations.questionId),
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
        .where(
          and(
            eq(knowledgeBaseNodesToExplanations.knowledgeBaseNodeId, input.id),
            eq(categories.licenseId, input.licenseId),
          ),
        );

      const [query1Result, query2Result] = await Promise.all([query1, query2]);

      return {
        explanations: query1Result,
        questionCount: query2Result[0]?.questionCount ?? 0,
      };
    }),
});

export type KnowledgeBaseNode = typeof knowledgeBaseNodes.$inferSelect;
