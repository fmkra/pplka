import { z } from "zod";
import { sql, and, eq, gte, asc, getTableColumns, isNull } from "drizzle-orm";

import {
  createTRPCRouter,
  optionalSessionProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import {
  learningActivity,
  learningProgress,
  learningCategory,
} from "~/server/db/learning";
import { questionInstances, questions } from "~/server/db/question";
import { categories } from "~/server/db/category";
import { questionsToExplanations } from "~/server/db/explanation";

export const learningRouter = createTRPCRouter({
  resetLearningProgress: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
        isRandom: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // For each question in the category and user that sends the request,
      // create a record that records answers for the question.
      // Set latestAttempt to 1, random to a random number, isDone to false.
      // Old per-question rows are removed to save space. The category session
      // itself is retained as a soft-deleted row for aggregate statistics.

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(learningCategory)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(learningCategory.userId, ctx.session.user.id),
              eq(learningCategory.categoryId, input.categoryId),
              isNull(learningCategory.deletedAt),
            ),
          );

        await tx.execute(sql`
          DELETE FROM ${learningProgress}
          USING ${questionInstances}
          WHERE ${learningProgress.questionInstanceId} = ${questionInstances.id}
            AND ${learningProgress.userId} = ${ctx.session.user.id}
            AND ${questionInstances.categoryId} = ${input.categoryId}
        `);

        await tx.insert(learningProgress).select(
          tx
            .select({
              id: sql`gen_random_uuid()`.as(learningProgress.id.name),
              userId: sql`${ctx.session.user.id}`.as(
                learningProgress.userId.name,
              ),
              questionInstanceId: questionInstances.id,
              latestAttempt: sql`1`.as(learningProgress.latestAttempt.name),
              random: sql`RANDOM() * ${input.isRandom ? 1 : 0}`.as(
                learningProgress.random.name,
              ),
              isDone: sql`false`.as(learningProgress.isDone.name),
              correctCount: sql`0`.as(learningProgress.correctCount.name),
              incorrectCount: sql`0`.as(learningProgress.incorrectCount.name),
            })
            .from(questionInstances)
            .where(eq(questionInstances.categoryId, input.categoryId)),
        );

        await tx.insert(learningCategory).values({
          id: crypto.randomUUID(),
          userId: ctx.session.user.id,
          categoryId: input.categoryId,
          latestAttempt: 1,
        });
      });
    }),

  deleteLearningProgress: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx.execute(sql`
          DELETE FROM ${learningProgress}
          USING ${questionInstances}
          WHERE ${learningProgress.questionInstanceId} = ${questionInstances.id}
            AND ${learningProgress.userId} = ${ctx.session.user.id}
            AND ${questionInstances.categoryId} = ${input.categoryId}
        `);

        await tx
          .update(learningCategory)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(learningCategory.userId, ctx.session.user.id),
              eq(learningCategory.categoryId, input.categoryId),
              isNull(learningCategory.deletedAt),
            ),
          );
      });
    }),

  // Public so that we can handle unauthorized here
  getAttempt: optionalSessionProcedure
    .input(
      z.object({
        categoryId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) return "UNAUTHORIZED";

      const attempt = (
        await ctx.db
          .select({
            currentAttempt: learningCategory.latestAttempt,
          })
          .from(learningCategory)
          .where(
            and(
              eq(learningCategory.userId, ctx.session.user.id),
              eq(learningCategory.categoryId, input.categoryId),
              isNull(learningCategory.deletedAt),
            ),
          )
      )[0];

      if (attempt === undefined) {
        return "NO_ATTEMPT";
      }
      const { currentAttempt } = attempt;

      // Questions that were answered correctly in previous attempts have latestAttempt < attemptNumber.
      // Questions that were answered correctly in this attempt have isDone = true and latestAttempt = attemptNumber.
      // Questions that were answered incorrectly in this attempt have latestAttempt > attemptNumber.
      // Questions that were not answered in this attempt have isDone = false and latestAttempt = attemptNumber.

      const q = await ctx.db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE \"latestAttempt\" < ${currentAttempt}) AS "previouslyAnswered",
          COUNT(*) FILTER (WHERE \"latestAttempt\" = ${currentAttempt} AND \"isDone\" = true) AS "answeredCorrectly",
          COUNT(*) FILTER (WHERE \"latestAttempt\" > ${currentAttempt}) AS "answeredIncorrectly",
          COUNT(*) FILTER (WHERE \"latestAttempt\" = ${currentAttempt} AND \"isDone\" = false) AS "notAnswered"
        FROM ${learningProgress}
        JOIN ${questionInstances} ON ${learningProgress.questionInstanceId} = ${questionInstances.id}
        WHERE ${learningProgress.userId} = ${ctx.session.user.id} AND ${questionInstances.categoryId} = ${input.categoryId}
      `);

      const previouslyAnswered = Number(q[0]!.previouslyAnswered);
      const answeredCorrectly = Number(q[0]!.answeredCorrectly);
      const answeredIncorrectly = Number(q[0]!.answeredIncorrectly);
      const notAnswered = Number(q[0]!.notAnswered);

      return {
        currentAttempt,
        previouslyAnswered,
        answeredCorrectly,
        answeredIncorrectly,
        notAnswered,
      };
    }),

  nextAttempt: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(learningCategory)
        .set({
          latestAttempt: sql`${learningCategory.latestAttempt} + 1`,
        })
        .where(
          and(
            eq(learningCategory.userId, ctx.session.user.id),
            eq(learningCategory.categoryId, input.categoryId),
            isNull(learningCategory.deletedAt),
          ),
        );
    }),

  recordLearningActivity: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
        day: z.string().date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(learningActivity)
        .values({
          userId: ctx.session.user.id,
          categoryId: input.categoryId,
          day: input.day,
        })
        .onConflictDoNothing();
    }),

  getQuestions: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
        attemptNumber: z.number(),
        limit: z.number().max(100),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // We only consider questions that weren't answered in previous attempts.

      const q = await ctx.db
        .select({
          learning_progress: getTableColumns(learningProgress),
          question_instance: getTableColumns(questionInstances),
          question: getTableColumns(questions),
          hasExplanation: sql<boolean>`exists(
            select 1 from ${questionsToExplanations}
            where ${questionsToExplanations.questionId} = ${questions.id}
          )`.as("has_explanation"),
        })
        .from(learningProgress)
        .innerJoin(
          questionInstances,
          eq(learningProgress.questionInstanceId, questionInstances.id),
        )
        .innerJoin(questions, eq(questionInstances.questionId, questions.id))
        .where(
          and(
            eq(learningProgress.userId, ctx.session.user.id),
            eq(questionInstances.categoryId, input.categoryId),
            gte(learningProgress.latestAttempt, input.attemptNumber),
          ),
        )
        .orderBy(
          asc(learningProgress.random),
          asc(questions.externalId),
          asc(questions.id),
        )
        .limit(input.limit)
        .offset(input.cursor ?? 0);

      return q.map((x, i) => ({
        ...x,
        questionNumber: i + (input.cursor ?? 0),
      }));
    }),

  answerQuestion: protectedProcedure
    .input(
      z.object({
        questionInstanceId: z.string(),
        isCorrect: z.boolean(),
        attemptNumber: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(learningProgress)
        .set({
          isDone: input.isCorrect,
          latestAttempt: input.isCorrect ? undefined : input.attemptNumber + 1,
        })
        .where(
          and(
            eq(learningProgress.userId, ctx.session.user.id),
            eq(learningProgress.questionInstanceId, input.questionInstanceId),
          ),
        );
    }),

  getLicenseProgress: optionalSessionProcedure
    .input(
      z.object({
        licenseId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user) return {};

      const category = await ctx.db
        .select({
          categoryId: categories.id,
          done: sql<number>`COUNT(*) FILTER (WHERE "isDone" = true)`,
          total: sql<number>`COUNT(*)`,
        })
        .from(questionInstances)
        .innerJoin(
          learningProgress,
          eq(questionInstances.id, learningProgress.questionInstanceId),
        )
        .innerJoin(categories, eq(questionInstances.categoryId, categories.id))
        .where(
          and(
            eq(learningProgress.userId, ctx.session.user.id),
            eq(categories.licenseId, input.licenseId),
          ),
        )
        .groupBy(categories.id);

      const output: Record<number, { done: number; total: number }> = {};
      for (const c of category) {
        output[c.categoryId] = {
          done: c.done,
          total: c.total,
        };
      }
      return output;
    }),
});
