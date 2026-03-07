"use client";

import { api } from "~/trpc/react";
import { Spinner } from "~/components/ui/spinner";
import Render from "./md-render";

export function KnowledgeBaseExplanations({
  knowledgeBaseNodeId,
}: {
  knowledgeBaseNodeId: string;
}) {
  const { data, isLoading } =
    api.explanation.getExplanationsForKnowledgeBaseNode.useQuery({
      id: knowledgeBaseNodeId,
    });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="mt-4 flex w-full justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-6">
          <Render
            explanations={data?.map(({ explanation }) => explanation) ?? []}
          />
        </div>
      )}
    </div>
  );
}
