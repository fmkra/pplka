"use client";

import { api } from "~/trpc/react";
import Render from "./md-render";
import { Spinner } from "~/components/ui/spinner";
import { HelpfulnessFeedback } from "./helpfulness-feedback";
import type { ExplanationElement } from "./md-render";
import { useCacheFirstData } from "~/offline/cache-first-query";
import { getCachedQuestionExplanations } from "~/offline/knowledge-base-cache";

export function Explanation({
  questionId,
  enabled,
  initialData,
  defaultShowExtraResources = false,
}: {
  questionId: string;
  enabled: boolean;
  initialData?: ExplanationElement[];
  defaultShowExtraResources?: boolean;
}) {
  const cache = useCacheFirstData({
    cacheKey: `question-explanations:${questionId}`,
    enabled: enabled && initialData === undefined,
    getCachedData: async () => {
      const cached = await getCachedQuestionExplanations(questionId);
      return cached === null
        ? { hit: false as const }
        : { hit: true as const, data: cached };
    },
  });
  const { data, isLoading: isServerLoading } =
    api.explanation.getExplanations.useQuery(
      { questionId: questionId },
      { enabled: cache.shouldEnableQuery },
    );

  const explanations =
    initialData ?? (cache.hasCacheHit ? cache.cachedData : data);
  const isLoading =
    initialData === undefined &&
    (cache.isCheckingCache || (cache.shouldEnableQuery && isServerLoading));

  if (isLoading)
    return (
      <div className="mt-4 flex w-full justify-center">
        <Spinner />
      </div>
    );
  if (explanations && explanations.length > 0)
    return (
      <>
        <Render
          explanations={explanations}
          defaultShowExtraResources={defaultShowExtraResources}
        />
        <HelpfulnessFeedback variant="explanation" questionId={questionId} />
      </>
    );
  return <p className="text-muted-foreground text-sm">Brak wyjaśnień</p>;
}
