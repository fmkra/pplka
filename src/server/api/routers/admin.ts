import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { categories } from "~/server/db/category";
import { contentFeedback } from "~/server/db/contentFeedback";
import { examAttempt } from "~/server/db/exam";
import { knowledgeBaseNodes } from "~/server/db/knowledgeBase";
import { learningActivity, learningCategory } from "~/server/db/learning";
import { licenses } from "~/server/db/license";
import { questionComments } from "~/server/db/questionComment";
import { questionInstances, questions } from "~/server/db/question";
import { users } from "~/server/db/user";
import type { db } from "~/server/db";
import { LICENSE_SEARCH_PARAM } from "~/app/links";

const pageInput = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const feedbackFiltersInput = z.object({
  source: z.enum(["all", "authenticated", "anonymous"]).default("all"),
  details: z.enum(["all", "with", "without"]).default("all"),
});

const questionFeedbackInput = pageInput.merge(feedbackFiltersInput).extend({
  categoryName: z.string().nullable().default(null),
});

const knowledgeBaseFeedbackInput = pageInput
  .merge(feedbackFiltersInput)
  .extend({ folderId: z.string().nullable().default(null) });

const feedbackHistogramInput = feedbackFiltersInput.extend({
  target: z.enum(["question", "article"]),
  targetId: z.string().optional(),
  categoryName: z.string().nullable().default(null),
  folderId: z.string().nullable().default(null),
});

const dashboardRangeInput = z.object({
  range: z.enum(["week", "month", "threeMonths", "year"]).default("month"),
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.user.isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next();
});

async function getQuestionUrls(ctx: { db: typeof db }, ids: string[]) {
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
  return `/baza-wiedzy/${encodeURIComponent(slug)}?${LICENSE_SEARCH_PARAM}=${encodeURIComponent(licenseUrl)}`;
}

function feedbackConditions(input: z.infer<typeof feedbackFiltersInput>) {
  return [
    input.source === "authenticated"
      ? isNotNull(contentFeedback.userId)
      : input.source === "anonymous"
        ? isNull(contentFeedback.userId)
        : undefined,
    input.details === "with"
      ? sql`${contentFeedback.details} is not null and btrim(${contentFeedback.details}) <> ''`
      : input.details === "without"
        ? sql`${contentFeedback.details} is null or btrim(${contentFeedback.details}) = ''`
        : undefined,
  ].filter((condition) => condition !== undefined);
}

function questionCategoryCondition(categoryName: string | null) {
  if (categoryName == null) return undefined;
  return sql`exists (
    select 1 from ${questionInstances}
    inner join ${categories} on ${categories.id} = ${questionInstances.categoryId}
    where ${questionInstances.questionId} = ${contentFeedback.questionId}
      and ${categories.name} = ${categoryName}
  )`;
}

async function getFolderArticleIds(
  ctx: { db: typeof db },
  folderId: string | null,
) {
  if (!folderId) return null;

  const nodes = await ctx.db
    .select({
      id: knowledgeBaseNodes.id,
      parentId: knowledgeBaseNodes.parentId,
      type: knowledgeBaseNodes.type,
    })
    .from(knowledgeBaseNodes);
  const descendants = new Set([folderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (
        node.parentId &&
        descendants.has(node.parentId) &&
        !descendants.has(node.id)
      ) {
        descendants.add(node.id);
        changed = true;
      }
    }
  }
  return nodes
    .filter((node) => node.type === "file" && descendants.has(node.id))
    .map((node) => node.id);
}

function articleFolderCondition(articleIds: string[] | null) {
  if (articleIds == null) return undefined;
  return articleIds.length > 0
    ? inArray(contentFeedback.knowledgeBaseNodeId, articleIds)
    : sql`false`;
}

export const adminRouter = createTRPCRouter({
  getDashboard: adminProcedure
    .input(dashboardRangeInput)
    .query(async ({ ctx, input }) => {
      const interval =
        input.range === "week"
          ? sql`interval '7 days'`
          : input.range === "month"
            ? sql`interval '1 month'`
            : input.range === "threeMonths"
              ? sql`interval '3 months'`
              : sql`interval '1 year'`;
      const useWeeklyBuckets =
        input.range === "threeMonths" || input.range === "year";
      const examBucket = useWeeklyBuckets
        ? sql`date_trunc('week', ${examAttempt.startedAt})`
        : sql`date_trunc('day', ${examAttempt.startedAt})`;
      const learningBucket = useWeeklyBuckets
        ? sql`date_trunc('week', ${learningActivity.day})`
        : sql`date_trunc('day', ${learningActivity.day})`;
      const registrationBucket = useWeeklyBuckets
        ? sql`date_trunc('week', ${users.registeredAt})`
        : sql`date_trunc('day', ${users.registeredAt})`;
      const activityBucket = useWeeklyBuckets
        ? sql`date_trunc('week', "activityDay")`
        : sql`date_trunc('day', "activityDay")`;

      const [userCount] = await ctx.db.select({ count: count() }).from(users);
      const [examCount] = await ctx.db
        .select({ count: count() })
        .from(examAttempt);
      const [finishedExamUserCount] = await ctx.db
        .select({
          count: sql<number>`count(distinct ${examAttempt.userId}) filter (where ${examAttempt.finishedAt} is not null)::int`,
        })
        .from(examAttempt);
      const [learningCount] = await ctx.db
        .select({ count: count() })
        .from(learningCategory);
      const [learningUserCount] = await ctx.db
        .select({
          count: sql<number>`count(distinct ${learningCategory.userId})::int`,
        })
        .from(learningCategory);
      const [feedbackCount] = await ctx.db
        .select({ count: count() })
        .from(contentFeedback);
      const [commentsCount] = await ctx.db
        .select({ count: count() })
        .from(questionComments);

      const examActivity = await ctx.db
        .select({
          date: sql<string>`to_char(${examBucket}, 'YYYY-MM-DD')`,
          exams: sql<number>`count(${examAttempt.id})::int`,
          users: sql<number>`count(distinct ${examAttempt.userId})::int`,
        })
        .from(examAttempt)
        .where(sql`${examAttempt.startedAt} >= now() - ${interval}`)
        .groupBy(examBucket)
        .orderBy(examBucket);

      const learningUsage = await ctx.db
        .select({
          date: sql<string>`to_char(${learningBucket}, 'YYYY-MM-DD')`,
          activities: sql<number>`count(${learningActivity.id})::int`,
          users: sql<number>`count(distinct ${learningActivity.userId})::int`,
        })
        .from(learningActivity)
        .where(sql`${learningActivity.day} >= (now() - ${interval})::date`)
        .groupBy(learningBucket)
        .orderBy(learningBucket);

      const registrationActivity = await ctx.db
        .select({
          date: sql<string>`to_char(${registrationBucket}, 'YYYY-MM-DD')`,
          newUsers: sql<number>`count(${users.id})::int`,
        })
        .from(users)
        .where(sql`${users.registeredAt} >= now() - ${interval}`)
        .groupBy(registrationBucket)
        .orderBy(registrationBucket);

      const activeUserActivity = await ctx.db.execute(sql`
        WITH "userActivity" AS (
          SELECT ${examAttempt.userId} AS "userId", ${examAttempt.startedAt} AS "activityDay"
          FROM ${examAttempt}
          WHERE ${examAttempt.startedAt} >= now() - ${interval}
          UNION
          SELECT ${learningActivity.userId} AS "userId", ${learningActivity.day}::timestamp AS "activityDay"
          FROM ${learningActivity}
          WHERE ${learningActivity.day} >= (now() - ${interval})::date
        )
        SELECT
          to_char(${activityBucket}, 'YYYY-MM-DD') AS "date",
          count(distinct "userId")::int AS "activeUsers"
        FROM "userActivity"
        GROUP BY ${activityBucket}
        ORDER BY ${activityBucket}
      `);

      const userActivityByDate = new Map<
        string,
        { date: string; newUsers: number; activeUsers: number }
      >();
      const getUserActivityDay = (date: string) => {
        const existing = userActivityByDate.get(date);
        if (existing) return existing;
        const created = { date, newUsers: 0, activeUsers: 0 };
        userActivityByDate.set(date, created);
        return created;
      };
      for (const row of registrationActivity) {
        getUserActivityDay(row.date).newUsers = row.newUsers;
      }
      for (const row of activeUserActivity) {
        const date = String(row.date);
        getUserActivityDay(date).activeUsers = Number(row.activeUsers);
      }
      const userActivity = [...userActivityByDate.values()].sort((a, b) =>
        a.date.localeCompare(b.date),
      );

      return {
        totals: {
          users: userCount?.count ?? 0,
          exams: examCount?.count ?? 0,
          finishedExamUsers: finishedExamUserCount?.count ?? 0,
          learningSessions: learningCount?.count ?? 0,
          learningUsers: learningUserCount?.count ?? 0,
          feedback: feedbackCount?.count ?? 0,
          comments: commentsCount?.count ?? 0,
        },
        examActivity,
        learningUsage,
        userActivity,
      };
    }),

  getLatestFeedback: adminProcedure
    .input(pageInput.merge(feedbackFiltersInput))
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
        .where(and(...feedbackConditions(input)))
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

  getFeedbackCount: adminProcedure
    .input(feedbackFiltersInput)
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ count: count() })
        .from(contentFeedback)
        .where(and(...feedbackConditions(input)));
      return row?.count ?? 0;
    }),

  getFeedbackFilterOptions: adminProcedure.query(async ({ ctx }) => {
    const [categoryRows, nodeRows] = await Promise.all([
      ctx.db
        .selectDistinct({ name: categories.name })
        .from(categories)
        .orderBy(categories.name),
      ctx.db
        .select({
          id: knowledgeBaseNodes.id,
          name: knowledgeBaseNodes.name,
          type: knowledgeBaseNodes.type,
          parentId: knowledgeBaseNodes.parentId,
          order: knowledgeBaseNodes.order,
        })
        .from(knowledgeBaseNodes)
        .orderBy(
          asc(knowledgeBaseNodes.parentId),
          asc(knowledgeBaseNodes.order),
        ),
    ]);

    return { categories: categoryRows, knowledgeBaseNodes: nodeRows };
  }),

  getQuestionFeedbackSummary: adminProcedure
    .input(questionFeedbackInput)
    .query(async ({ ctx, input }) => {
      const conditions = [
        ...feedbackConditions(input),
        questionCategoryCondition(input.categoryName),
      ].filter((condition) => condition !== undefined);
      const rows = await ctx.db
        .select({
          questionId: contentFeedback.questionId,
          question: questions.question,
          ratings: count(contentFeedback.id),
          averageRating: avg(contentFeedback.rating),
        })
        .from(contentFeedback)
        .innerJoin(questions, eq(contentFeedback.questionId, questions.id))
        .where(and(...conditions))
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

  getQuestionFeedbackSummaryCount: adminProcedure
    .input(feedbackFiltersInput.extend({ categoryName: z.string().nullable() }))
    .query(async ({ ctx, input }) => {
      const conditions = [
        ...feedbackConditions(input),
        questionCategoryCondition(input.categoryName),
      ].filter((condition) => condition !== undefined);
      const [row] = await ctx.db
        .select({
          count: sql<number>`count(distinct ${contentFeedback.questionId})::int`,
        })
        .from(contentFeedback)
        .where(and(...conditions));
      return row?.count ?? 0;
    }),

  getKnowledgeBaseFeedbackSummary: adminProcedure
    .input(knowledgeBaseFeedbackInput)
    .query(async ({ ctx, input }) => {
      const articleIds = await getFolderArticleIds(ctx, input.folderId);
      const conditions = [
        ...feedbackConditions(input),
        articleFolderCondition(articleIds),
      ].filter((condition) => condition !== undefined);
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
        .where(and(...conditions))
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

  getKnowledgeBaseFeedbackSummaryCount: adminProcedure
    .input(feedbackFiltersInput.extend({ folderId: z.string().nullable() }))
    .query(async ({ ctx, input }) => {
      const articleIds = await getFolderArticleIds(ctx, input.folderId);
      const conditions = [
        ...feedbackConditions(input),
        articleFolderCondition(articleIds),
      ].filter((condition) => condition !== undefined);
      const [row] = await ctx.db
        .select({
          count: sql<number>`count(distinct ${contentFeedback.knowledgeBaseNodeId})::int`,
        })
        .from(contentFeedback)
        .where(and(...conditions));
      return row?.count ?? 0;
    }),

  getFeedbackHistogram: adminProcedure
    .input(feedbackHistogramInput)
    .query(async ({ ctx, input }) => {
      const articleIds =
        input.target === "article"
          ? await getFolderArticleIds(ctx, input.folderId)
          : null;
      const conditions = [
        ...feedbackConditions(input),
        input.target === "question"
          ? isNotNull(contentFeedback.questionId)
          : isNotNull(contentFeedback.knowledgeBaseNodeId),
        input.targetId
          ? input.target === "question"
            ? eq(contentFeedback.questionId, input.targetId)
            : eq(contentFeedback.knowledgeBaseNodeId, input.targetId)
          : undefined,
        input.target === "question"
          ? questionCategoryCondition(input.categoryName)
          : articleFolderCondition(articleIds),
      ].filter((condition) => condition !== undefined);

      const rows = await ctx.db
        .select({ rating: contentFeedback.rating, count: count() })
        .from(contentFeedback)
        .where(and(...conditions))
        .groupBy(contentFeedback.rating)
        .orderBy(contentFeedback.rating);
      const counts = new Map(rows.map((row) => [row.rating, row.count]));
      return [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: counts.get(rating) ?? 0,
      }));
    }),

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
