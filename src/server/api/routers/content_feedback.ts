import z from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { contentFeedback } from "~/server/db/contentFeedback";

const submitRatingInput = z
  .object({
    questionId: z.string().optional(),
    knowledgeBaseNodeId: z.string().optional(),
    rating: z.number().int().min(1).max(5),
  })
  .refine(
    (v) =>
      (v.questionId != null && v.knowledgeBaseNodeId == null) ||
      (v.questionId == null && v.knowledgeBaseNodeId != null),
    { message: "Podaj dokładnie jeden identyfikator: pytania albo węzła bazy wiedzy." },
  );

export const contentFeedbackRouter = createTRPCRouter({
  submitRating: publicProcedure
    .input(submitRatingInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;

      const [row] = await ctx.db
        .insert(contentFeedback)
        .values({
          questionId: input.questionId ?? null,
          knowledgeBaseNodeId: input.knowledgeBaseNodeId ?? null,
          userId,
          rating: input.rating,
        })
        .returning({ id: contentFeedback.id });

      if (!row) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nie udało się zapisać oceny.",
        });
      }

      return { id: row.id };
    }),

  submitDetails: publicProcedure
    .input(
      z.object({
        id: z.string(),
        details: z.string().max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const trimmed = input.details.trim();

      const [existing] = await ctx.db
        .select()
        .from(contentFeedback)
        .where(eq(contentFeedback.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nie znaleziono wpisu." });
      }

      if (existing.userId != null) {
        if (!ctx.session?.user || ctx.session.user.id !== existing.userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień." });
        }
      }

      await ctx.db
        .update(contentFeedback)
        .set({ details: trimmed.length > 0 ? trimmed : null })
        .where(eq(contentFeedback.id, input.id));

      return { ok: true as const };
    }),
});
