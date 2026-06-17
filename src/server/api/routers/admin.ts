import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  avg,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  sql,
} from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { categories } from "~/server/db/category";
import { contentFeedback } from "~/server/db/contentFeedback";
import { examAttempt } from "~/server/db/exam";
import { knowledgeBaseNodes } from "~/server/db/knowledgeBase";
import { learningCategory } from "~/server/db/learning";
import { licenses } from "~/server/db/license";
import { questionComments } from "~/server/db/questionComment";
import { questionInstances, questions } from "~/server/db/question";
import { users } from "~/server/db/user";
import type { db } from "~/server/db";

const pageInput = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.user.isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next();
});

async function getQuestionUrls(
  ctx: { db: typeof db },
  ids: string[],
) {
  if (ids.length === 0) return new Map<string, string>();

  const rows = await ctx.db
    .select({
      questionId: questionInstances.questionId,
      licenseUrl: licenses.url,
    })
    .from(questionInstances)
    .innerJoin(categories, eq(questionInstances.categoryId, categories.id))
    .innerJoin(licenses, eq(categories.licenseId, licenses.id))
    .where(inArray(questionInstances.questionId, ids))
    .orderBy(licenses.id);

  const urls = new Map<string, string>();
  for (const row of rows) {
    if (!urls.has(row.questionId)) {
      urls.set(
        row.questionId,
        `/${row.licenseUrl}/baza-pytan/${row.questionId}`,
      );
    }
  }

  return urls;
}

async function getDefaultLicenseUrl(ctx: { db: typeof db }) {
  const [license] = await ctx.db
    .select({ url: licenses.url })
    .from(licenses)
    .orderBy(licenses.id)
    .limit(1);

  return license?.url ?? "ppla";
}

function knowledgeBaseUrl(licenseUrl: string, slug: string | null) {
  if (!slug) return null;
  return `/${licenseUrl}/baza-wiedzy/${encodeURIComponent(slug)}`;
}

export const adminRouter = createTRPCRouter({
  getDashboard: adminProcedure.query(async ({ ctx }) => {
    const [userCount] = await ctx.db.select({ count: count() }).from(users);
    const [examCount] = await ctx.db
      .select({ count: count() })
      .from(examAttempt);
    const [learningCount] = await ctx.db
      .select({ count: count() })
      .from(learningCategory);
    const [feedbackCount] = await ctx.db
      .select({ count: count() })
      .from(contentFeedback);
    const [commentsCount] = await ctx.db
      .select({ count: count() })
      .from(questionComments);

    const activity = await ctx.db
      .select({
        date: sql<string>`to_char(${examAttempt.startedAt}, 'YYYY-MM-DD')`,
        exams: sql<number>`count(${examAttempt.id})::int`,
        users: sql<number>`count(distinct ${examAttempt.userId})::int`,
      })
      .from(examAttempt)
      .groupBy(sql`to_char(${examAttempt.startedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${examAttempt.startedAt}, 'YYYY-MM-DD')`);

    return {
      totals: {
        users: userCount?.count ?? 0,
        exams: examCount?.count ?? 0,
        learningInProgress: learningCount?.count ?? 0,
        feedback: feedbackCount?.count ?? 0,
        comments: commentsCount?.count ?? 0,
      },
      activity,
    };
  }),

  getLatestFeedback: adminProcedure
    .input(pageInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: contentFeedback.id,
          rating: contentFeedback.rating,
          details: contentFeedback.details,
          submittedAt: contentFeedback.submittedAt,
          questionId: contentFeedback.questionId,
          knowledgeBaseNodeId: contentFeedback.knowledgeBaseNodeId,
          question: questions.question,
          knowledgeBaseNodeName: knowledgeBaseNodes.name,
          knowledgeBaseNodeSlug: knowledgeBaseNodes.slug,
          userName: users.name,
          userEmail: users.email,
        })
        .from(contentFeedback)
        .leftJoin(questions, eq(contentFeedback.questionId, questions.id))
        .leftJoin(
          knowledgeBaseNodes,
          eq(contentFeedback.knowledgeBaseNodeId, knowledgeBaseNodes.id),
        )
        .leftJoin(users, eq(contentFeedback.userId, users.id))
        .orderBy(desc(contentFeedback.submittedAt))
        .limit(input.limit)
        .offset(input.offset);

      const questionUrls = await getQuestionUrls(
        ctx,
        rows
          .map((row) => row.questionId)
          .filter((id): id is string => id != null),
      );
      const licenseUrl = await getDefaultLicenseUrl(ctx);

      return rows.map((row) => ({
        ...row,
        targetUrl:
          row.questionId != null
            ? (questionUrls.get(row.questionId) ?? null)
            : knowledgeBaseUrl(licenseUrl, row.knowledgeBaseNodeSlug),
      }));
    }),

  getFeedbackCount: adminProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db.select({ count: count() }).from(contentFeedback);
    return row?.count ?? 0;
  }),

  getQuestionFeedbackSummary: adminProcedure
    .input(pageInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          questionId: contentFeedback.questionId,
          question: questions.question,
          ratings: count(contentFeedback.id),
          averageRating: avg(contentFeedback.rating),
        })
        .from(contentFeedback)
        .innerJoin(questions, eq(contentFeedback.questionId, questions.id))
        .groupBy(contentFeedback.questionId, questions.question)
        .orderBy(desc(count(contentFeedback.id)))
        .limit(input.limit)
        .offset(input.offset);

      const questionUrls = await getQuestionUrls(
        ctx,
        rows
          .map((row) => row.questionId)
          .filter((id): id is string => id != null),
      );

      return rows.map((row) => ({
        ...row,
        averageRating: Number(row.averageRating ?? 0),
        targetUrl: row.questionId
          ? (questionUrls.get(row.questionId) ?? null)
          : null,
      }));
    }),

  getQuestionFeedbackSummaryCount: adminProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({
        count: sql<number>`count(distinct ${contentFeedback.questionId})::int`,
      })
      .from(contentFeedback);
    return row?.count ?? 0;
  }),

  getKnowledgeBaseFeedbackSummary: adminProcedure
    .input(pageInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          knowledgeBaseNodeId: contentFeedback.knowledgeBaseNodeId,
          name: knowledgeBaseNodes.name,
          slug: knowledgeBaseNodes.slug,
          ratings: count(contentFeedback.id),
          averageRating: avg(contentFeedback.rating),
        })
        .from(contentFeedback)
        .innerJoin(
          knowledgeBaseNodes,
          eq(contentFeedback.knowledgeBaseNodeId, knowledgeBaseNodes.id),
        )
        .groupBy(
          contentFeedback.knowledgeBaseNodeId,
          knowledgeBaseNodes.name,
          knowledgeBaseNodes.slug,
        )
        .orderBy(desc(count(contentFeedback.id)))
        .limit(input.limit)
        .offset(input.offset);

      const licenseUrl = await getDefaultLicenseUrl(ctx);

      return rows.map((row) => ({
        ...row,
        averageRating: Number(row.averageRating ?? 0),
        targetUrl: knowledgeBaseUrl(licenseUrl, row.slug),
      }));
    }),

  getKnowledgeBaseFeedbackSummaryCount: adminProcedure.query(
    async ({ ctx }) => {
      const [row] = await ctx.db
        .select({
          count: sql<number>`count(distinct ${contentFeedback.knowledgeBaseNodeId})::int`,
        })
        .from(contentFeedback);
      return row?.count ?? 0;
    },
  ),

  getLatestComments: adminProcedure
    .input(pageInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          ...getTableColumns(questionComments),
          question: questions.question,
          userName: users.name,
          userEmail: users.email,
        })
        .from(questionComments)
        .innerJoin(questions, eq(questionComments.questionId, questions.id))
        .leftJoin(users, eq(questionComments.userId, users.id))
        .orderBy(desc(questionComments.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const questionUrls = await getQuestionUrls(
        ctx,
        rows.map((row) => row.questionId),
      );

      return rows.map((row) => ({
        ...row,
        targetUrl: questionUrls.get(row.questionId) ?? null,
      }));
    }),

  getCommentsCount: adminProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ count: count() })
      .from(questionComments);
    return row?.count ?? 0;
  }),
});
