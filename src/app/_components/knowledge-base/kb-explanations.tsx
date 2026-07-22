import Render from "./md-render";
import { HelpfulnessFeedback } from "./helpfulness-feedback";
import type {
  getKnowledgeBaseNodeData,
  KnowledgeBaseNode,
} from "~/server/api/routers/explanation";
import { Suspense } from "react";
import { KnowledgeBaseArticleNavigation } from "./article-navigation";

type ExplanationsData = Awaited<ReturnType<typeof getKnowledgeBaseNodeData>>;

export function KnowledgeBaseExplanations({
  data,
  knowledgeBaseNodeId,
  siblings,
}: {
  data: ExplanationsData;
  knowledgeBaseNodeId: string;
  siblings: [KnowledgeBaseNode | null, KnowledgeBaseNode | null];
}) {
  return (
    <div className="space-y-2">
      <Suspense fallback={<div className="mt-2 border-t pt-4 pb-2" />}>
        <KnowledgeBaseArticleNavigation
          knowledgeBaseNodeId={knowledgeBaseNodeId}
          questionCounts={data.questionCounts}
          siblings={[
            siblings[0]
              ? { name: siblings[0].name, slug: siblings[0].slug }
              : null,
            siblings[1]
              ? { name: siblings[1].name, slug: siblings[1].slug }
              : null,
          ]}
        />
      </Suspense>

      <div className="space-y-6">
        <Render
          explanations={
            data?.explanations?.map(({ explanation }) => ({
              explanation: explanation,
              isExtraResource: false,
            })) ?? []
          }
        />
        <HelpfulnessFeedback
          variant="material"
          knowledgeBaseNodeId={knowledgeBaseNodeId}
        />
      </div>
    </div>
  );
}
