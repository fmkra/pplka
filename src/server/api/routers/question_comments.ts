import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { count, desc, eq } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { questionComments } from "~/server/db/questionComment";

export const questionCommentsRouter = createTRPCRouter({
  getComments: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: questionComments.id,
          displayName: questionComments.displayName,
          content: questionComments.content,
          createdAt: questionComments.createdAt,
        })
        .from(questionComments)
        .where(eq(questionComments.questionId, input.questionId))
        .orderBy(desc(questionComments.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rows;
    }),

  getCommentsCount: publicProcedure
    .input(z.object({ questionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ count: count() })
        .from(questionComments)
        .where(eq(questionComments.questionId, input.questionId));

      return row?.count ?? 0;
    }),

  createComment: protectedProcedure
    .input(
      z.object({
        questionId: z.string(),
        content: z.string().trim().min(1).max(5000),
        displayName: z.string().trim().max(100).nullable(),
        acceptTos: z.literal(true, {
          errorMap: () => ({
            message: "Musisz zaakceptować regulamin, aby dodać komentarz.",
          }),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const displayName =
        input.displayName && input.displayName.length > 0
          ? input.displayName
          : null;

      const [row] = await ctx.db
        .insert(questionComments)
        .values({
          questionId: input.questionId,
          userId: ctx.session.user.id,
          displayName,
          content: input.content,
        })
        .returning({
          id: questionComments.id,
          displayName: questionComments.displayName,
          content: questionComments.content,
          createdAt: questionComments.createdAt,
        });

      if (!row) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nie udało się dodać komentarza.",
        });
      }

      return row;
    }),
});
