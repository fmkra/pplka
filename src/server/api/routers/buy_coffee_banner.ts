import { z } from "zod";
import { isBuyCoffeeBannerPathname } from "~/lib/buy-coffee-banner";
import { buyCoffeeBannerImpressions } from "~/server/db/buyCoffeeBanner";
import { createTRPCRouter, noSessionProcedure } from "../trpc";

export const buyCoffeeBannerRouter = createTRPCRouter({
  recordImpression: noSessionProcedure
    .input(
      z.object({
        displayId: z.string().uuid(),
        dismissalCount: z.number().int().min(0).max(2_147_483_647),
        pathname: z
          .string()
          .refine(isBuyCoffeeBannerPathname, "Unsupported banner pathname"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(buyCoffeeBannerImpressions)
        .values({
          id: input.displayId,
          dismissalCount: input.dismissalCount,
          pathname: input.pathname,
        })
        .onConflictDoNothing({ target: buyCoffeeBannerImpressions.id });

      return { ok: true as const };
    }),
});
