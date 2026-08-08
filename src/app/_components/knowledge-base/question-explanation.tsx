"use client";

import { api } from "~/trpc/react";
import Render from "./md-render";
import { Spinner } from "~/components/ui/spinner";
import { HelpfulnessFeedback } from "./helpfulness-feedback";
import type { ExplanationElement } from "./md-render";

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
  const { data, isLoading } = api.explanation.getExplanations.useQuery(
    { questionId: questionId },
    { enabled: enabled && initialData === undefined },
  );

  const explanations = initialData ?? data;

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
