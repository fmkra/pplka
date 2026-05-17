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
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] border-t pt-4 pb-2">
        {siblings[0] ? (
          <Link
            className="my-auto text-blue-500"
            href={`./${siblings[0].slug}`}
          >
            {"< "}
            {siblings[0]?.name}
          </Link>
        ) : (
          <div />
        )}
        {!!data?.questionCount && (
          <Link
            href={`../${QUESTIONS}?${QUESTIONS_KNOWLEDGE_BASE_ID}=${knowledgeBaseNodeId}`}
            className="text-center text-blue-500"
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
        )}
        {siblings[1] ? (
          <Link
            className="my-auto text-right text-blue-500"
            href={`./${siblings[1].slug}`}
          >
            {siblings[1]?.name}
            {" >"}
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
