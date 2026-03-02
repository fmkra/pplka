import { z } from "zod";
import {
  ilike,
  or,
  sql,
  and,
  inArray,
  eq,
  // countDistinct,
  count,
} from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { questionInstances, questions } from "~/server/db/question";
import { categories } from "~/server/db/category";
import { licenses } from "~/server/db/license";
import { questionsToExplanations } from "~/server/db/explanation";

export type CategoryAgg = {
  id: number;
  name: string;
  color: string;
  license: { name: string };
};

function getWhereConditions(input: {
  search?: string | undefined;
  categoryIds?: number[] | undefined;
  licenseId?: number | undefined;
}) {
  const whereConditions = [];

  if (input.search) {
    whereConditions.push(
      or(
        ilike(questions.externalId, `%${input.search}%`),
        ilike(questions.question, `%${input.search}%`),
        ilike(questions.answerCorrect, `%${input.search}%`),
        ilike(questions.answerIncorrect1, `%${input.search}%`),
        ilike(questions.answerIncorrect2, `%${input.search}%`),
        ilike(questions.answerIncorrect3, `%${input.search}%`),
      ),
    );
  }

  if (input.licenseId) {
    whereConditions.push(eq(licenses.id, input.licenseId));
  }

  if (input.categoryIds && input.categoryIds.length > 0) {
    whereConditions.push(
      inArray(questionInstances.categoryId, input.categoryIds),
    );
  }

  return and(...whereConditions);
}

export const questionDatabaseRouter = createTRPCRouter({
  getQuestionsWithAllCategories: publicProcedure
    .input(
      z.object({
        licenseId: z.number().optional(),
        categoryIds: z.array(z.number()).optional(),
        search: z.string().optional(),
        limit: z.number().max(100).optional(),
        offset: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const categoriesAgg = sql<CategoryAgg[]>`
        json_agg(
          json_build_object(
            'id', ${categories.id},
            'name', ${categories.name},
            'color', ${categories.color},
            'license', json_build_object(
              'name', ${licenses.name}
            )
          )
        )
      `.as("categories");

      return await ctx.db
        .select({
          question: questions,
          categories: categoriesAgg,
        })
        .from(questions)
        .innerJoin(
          questionInstances,
          eq(questions.id, questionInstances.questionId),
        )
        .innerJoin(categories, eq(questionInstances.categoryId, categories.id))
        .innerJoin(licenses, eq(categories.licenseId, licenses.id))
        .where(getWhereConditions(input))
        .groupBy(questions.id)
        .orderBy(questions.externalId)
        .limit(input.limit ?? 20)
        .offset(input.offset ?? 0);
    }),

  getQuestions: publicProcedure
    .input(
      z.object({
        categoryIds: z.array(z.number()).optional(),
        search: z.string().optional(),
        limit: z.number().max(100).optional(),
        offset: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select({
          question: questions,
          questionInstance: questionInstances,
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
        .where(getWhereConditions(input))
        .orderBy(questions.externalId)
        .limit(input.limit ?? 20)
        .offset(input.offset ?? 0);
    }),

  getQuestionsCount: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        categoryIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const c = await ctx.db
        // .select({ count: countDistinct(questions.id) })
        .select({ count: count() })
        .from(questions)
        .innerJoin(
          questionInstances,
          eq(questions.id, questionInstances.questionId),
        )
        .innerJoin(categories, eq(questionInstances.categoryId, categories.id))
        .innerJoin(licenses, eq(categories.licenseId, licenses.id))
        .where(getWhereConditions(input));

      return c[0]?.count ?? 0;
    }),

  getCategories: publicProcedure
    .input(
      z.object({
        licenseIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.categories.findMany({
        with: {
          license: true,
        },
        where:
          input.licenseIds && input.licenseIds.length > 0
            ? inArray(categories.licenseId, input.licenseIds)
            : undefined,
        orderBy: (category, { asc }) => [asc(category.id)],
      });
    }),

  getLicenses: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.licenses.findMany({
      orderBy: (license, { asc }) => [asc(license.id)],
    });
  }),
});
