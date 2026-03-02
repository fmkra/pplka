"use client";

import { api } from "~/trpc/react";
import MdRender from "../md-render";
import { Spinner } from "~/components/ui/spinner";

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
          {data?.map(({ explanation }) => (
            <MdRender key={explanation.id}>{explanation.explanation}</MdRender>
          ))}
        </div>
      )}
    </div>
  );
}
