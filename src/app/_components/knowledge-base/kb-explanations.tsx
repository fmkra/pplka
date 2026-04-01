"use client";

import { api } from "~/trpc/react";
import { Spinner } from "~/components/ui/spinner";
import Render from "./md-render";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { QUESTIONS } from "~/app/links";
import { useLicenseContext } from "~/app/[license]/license-context";
import { conjugate } from "~/lib/utils";

export function KnowledgeBaseExplanations({
  knowledgeBaseNodeId,
}: {
  knowledgeBaseNodeId: string;
}) {
  const license = useLicenseContext();

  const { data, isLoading } =
    api.explanation.getExplanationsForKnowledgeBaseNode.useQuery({
      id: knowledgeBaseNodeId,
      licenseId: license.id,
    });

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="mt-4 flex w-full justify-center">
          <Spinner />
        </div>
      ) : (
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
                  {conjugate(
                    data.questionCount,
                    "pytanie",
                    "pytania",
                    "pytania",
                  )}
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
          </div>
        </>
      )}
    </div>
  );
}
