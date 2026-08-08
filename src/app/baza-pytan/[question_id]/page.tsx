import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Main from "~/app/_components/main";
import {
  getAllQuestionIds,
  getQuestionPageData,
} from "~/app/_queries/question-base";
import { Question } from "~/app/[license]/baza-pytan/question";
import { QuestionComments } from "~/app/[license]/baza-pytan/[question_id]/question-comments";
import { questionHref } from "~/app/links";
import { QuestionBackLink } from "./question-back-link";

const BASE_URL = "https://www.pplka.pl";

export const dynamicParams = true;

function plainText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[`*_#[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, length: number) {
  return value.length <= length
    ? value
    : `${value.slice(0, length - 1).trimEnd()}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ question_id: string }>;
}): Promise<Metadata> {
  const { question_id: questionId } = await params;
  const data = await getQuestionPageData(questionId);
  if (!data) notFound();

  const question = plainText(data.question.question);
  const correctAnswer = plainText(data.question.answerCorrect);
  const explanation = data.explanations.find(
    ({ explanation }) => explanation.type === "text",
  );
  const description = truncate(
    `${question} Poprawna odpowiedź: ${correctAnswer}.${
      explanation
        ? ` Wyjaśnienie: ${plainText(explanation.explanation.explanation)}`
        : ""
    }`,
    160,
  );
  const canonical = `${BASE_URL}${questionHref(questionId)}`;

  return {
    title: truncate(`${question} – pytanie egzaminacyjne`, 65),
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: truncate(question, 95),
      description,
      url: canonical,
    },
    robots: { index: true, follow: true },
  };
}

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ question_id: string }>;
}) {
  const { question_id: questionId } = await params;
  const data = await getQuestionPageData(questionId);
  if (!data) notFound();

  const licenses = [
    ...new Set(data.contexts.map(({ licenseUrl }) => licenseUrl)),
  ];
  const primaryContext = data.contexts[0]!;

  return (
    <Main>
      <div className="mb-6">
        <Suspense fallback={null}>
          <QuestionBackLink licenses={licenses} />
        </Suspense>
      </div>

      <Question
        question={data.question}
        category={primaryContext.category}
        hasExplanation={data.explanations.length > 0}
        explanations={data.explanations}
        explanationDefaultOpen
        detailedExplanationDefaultOpen
        detailPage
      />

      <QuestionComments questionId={questionId} />
    </Main>
  );
}

// For now we disable static generation of question pages to avoid long build times.
// export async function generateStaticParams() {
//   return getAllQuestionIds();
// }
