import z from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { eq, inArray } from "drizzle-orm";
import { categories } from "~/server/db/category";
import { questionInstances } from "~/server/db/question";
import { questionsToExplanations } from "~/server/db/explanation";
import type { inferRouterOutputs } from "@trpc/server";

export const downloadRouter = createTRPCRouter({
  getCategories: publicProcedure
    .input(
      z.object({
        licenseId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.categories.findMany({
        where: eq(categories.licenseId, input.licenseId),
      });
    }),

  getQuestions: publicProcedure
    .input(
      z.object({
        categoryId: z.number(),
        limit: z.number().min(1).max(100).default(100),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const data = await ctx.db.query.questionInstances.findMany({
        where: eq(questionInstances.categoryId, input.categoryId),
        with: {
          question: true,
        },
        limit: input.limit,
        offset: input.offset,
        orderBy: (questionInstance, { asc }) => [asc(questionInstance.id)],
      });

      const questionIds = data.map((row) => row.question.id);
      const explainedQuestionIds =
        questionIds.length === 0
          ? new Set<string>()
          : new Set(
              (
                await ctx.db
                  .select({
                    questionId: questionsToExplanations.questionId,
                  })
                  .from(questionsToExplanations)
                  .where(inArray(questionsToExplanations.questionId, questionIds))
                  .groupBy(questionsToExplanations.questionId)
              ).map((row) => row.questionId),
            );

      return data.map((x) => ({
        question: x.question,
        questionInstance: {
          id: x.id,
          categoryId: x.categoryId,
        },
        hasExplanation: explainedQuestionIds.has(x.question.id),
      }));
    }),

});

export type GetQuestionsResponse = inferRouterOutputs<
  typeof downloadRouter
>["getQuestions"];
