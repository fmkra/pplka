import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { explanations, questionsToExplanations } from "~/server/db/explanation";
import { eq, isNull, asc } from "drizzle-orm";
import {
  knowledgeBaseNodes,
  knowledgeBaseNodesToExplanations,
} from "~/server/db/knowledgeBase";

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
        })
        .from(explanations)
        .innerJoin(
          questionsToExplanations,
          eq(explanations.id, questionsToExplanations.explanationId),
        )
        .where(eq(questionsToExplanations.questionId, input.questionId));
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
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
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
    }),
});

export type KnowledgeBaseNode = typeof knowledgeBaseNodes.$inferSelect;
