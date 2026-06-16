import Render from "./md-render";
import Link from "next/link";
import { QUESTIONS, QUESTIONS_KNOWLEDGE_BASE_ID } from "~/app/links";
import { conjugate } from "~/lib/utils";
import { HelpfulnessFeedback } from "./helpfulness-feedback";
import type {
  getExplanationsForKnowledgeBaseNode,
  KnowledgeBaseNode,
} from "~/server/api/routers/explanation";

type ExplanationsData = Awaited<
  ReturnType<typeof getExplanationsForKnowledgeBaseNode>
>;

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
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] gap-y-4 border-t pt-4 pb-2 max-sm:grid-cols-2">
        {siblings[0] ? (
          <Link
            className="flex items-center gap-2 text-blue-500"
            href={`./${siblings[0].slug}`}
          >
            <span>{"< "}</span>
            <span>{siblings[0]?.name}</span>
          </Link>
        ) : (
          <div />
        )}
        {data?.questionCount ? (
          <Link
            href={`../${QUESTIONS}?${QUESTIONS_KNOWLEDGE_BASE_ID}=${knowledgeBaseNodeId}`}
            className="text-center text-blue-500 max-sm:order-2 max-sm:col-span-2"
          >
            {data.questionCount}{" "}
            {conjugate(
              data.questionCount,
              "pytanie jest powiązane",
              "pytania są powiązane",
              "pytań jest powiązanych",
            )}{" "}
            z tym materiałem
          </Link>
        ) : (
          <div />
        )}
        {siblings[1] ? (
          <Link
            className="flex items-center justify-end gap-2 text-right text-blue-500 max-sm:order-1"
            href={`./${siblings[1].slug}`}
          >
            <span>{siblings[1]?.name}</span>
            <span>{" >"}</span>
          </Link>
        ) : (
          <div />
        )}
      </div>

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
