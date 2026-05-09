import Render from "./md-render";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { QUESTIONS } from "~/app/links";
import { conjugate } from "~/lib/utils";
import { HelpfulnessFeedback } from "./helpfulness-feedback";
import type { getExplanationsForKnowledgeBaseNode } from "~/server/api/routers/explanation";

type ExplanationsData = Awaited<
  ReturnType<typeof getExplanationsForKnowledgeBaseNode>
>;

export function KnowledgeBaseExplanations({
  data,
  knowledgeBaseNodeId,
}: {
  data: ExplanationsData;
  knowledgeBaseNodeId: string;
}) {
  return (
    <div className="space-y-2">
      <>
        {!!data?.questionCount && (
          <div className="mt-2 flex items-center justify-end gap-2 border-t pt-2">
            {data.questionCount}{" "}
            {conjugate(
              data.questionCount,
              "pytanie jest powiązane",
              "pytania są powiązane",
              "pytań jest powiązanych",
            )}{" "}
            z tym materiałem
            <Button asChild variant="outline">
              <Link
                href={`../${QUESTIONS}?knowledge_base_id=${knowledgeBaseNodeId}`}
              >
                Pokaż{" "}
                {conjugate(data.questionCount, "pytanie", "pytania", "pytania")}
              </Link>
            </Button>
          </div>
        )}

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
      </>
    </div>
  );
}
