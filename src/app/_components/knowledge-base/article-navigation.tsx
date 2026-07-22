"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  KNOWLEDGE_BASE_LICENSE,
  knowledgeBaseHref,
  LICENSES,
  QUESTIONS,
  QUESTIONS_KNOWLEDGE_BASE_ID,
} from "~/app/links";
import { conjugate } from "~/lib/utils";

type Sibling = { name: string; slug: string | null } | null;

export function KnowledgeBaseArticleNavigation({
  knowledgeBaseNodeId,
  questionCounts,
  siblings,
}: {
  knowledgeBaseNodeId: string;
  questionCounts: Record<string, number>;
  siblings: [Sibling, Sibling];
}) {
  const searchParams = useSearchParams();
  const requestedLicense = searchParams.get(KNOWLEDGE_BASE_LICENSE);
  const license =
    requestedLicense && LICENSES.includes(requestedLicense)
      ? requestedLicense
      : LICENSES[0]!;
  const questionCount = questionCounts[license] ?? 0;

  return (
    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] gap-y-4 border-t pt-4 pb-2 max-sm:grid-cols-2">
      {siblings[0] ? (
        <Link
          className="flex items-center gap-2 text-blue-500"
          href={knowledgeBaseHref(license, siblings[0].slug ?? undefined)}
        >
          <span>{"< "}</span>
          <span>{siblings[0].name}</span>
        </Link>
      ) : (
        <div />
      )}
      {questionCount ? (
        <Link
          href={`/${license}/${QUESTIONS}?${QUESTIONS_KNOWLEDGE_BASE_ID}=${knowledgeBaseNodeId}`}
          className="text-center text-blue-500 max-sm:order-2 max-sm:col-span-2"
        >
          {questionCount}{" "}
          {conjugate(
            questionCount,
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
          href={knowledgeBaseHref(license, siblings[1].slug ?? undefined)}
        >
          <span>{siblings[1].name}</span>
          <span>{" >"}</span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
