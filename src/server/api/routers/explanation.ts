import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { explanations, questionsToExplanations } from "~/server/db/explanation";
import { eq } from "drizzle-orm";

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
});
