import { and, eq, sql } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Main from "~/app/_components/main";
import { metadataBuilder } from "~/app/seo";
import { QUESTIONS } from "~/app/links";
import { Question } from "../question";
import { QuestionComments } from "./question-comments";
import { db } from "~/server/db";
import { categories } from "~/server/db/category";
import { licenses } from "~/server/db/license";
import { questionInstances, questions } from "~/server/db/question";
import { questionsToExplanations } from "~/server/db/explanation";
import { Button } from "~/components/ui/button";

export const generateMetadata = metadataBuilder((_url, name) => ({
  title: `Pytanie - Baza pytań - ${name.short}`,
  description: `Szczegóły pytania egzaminacyjnego i komentarze użytkowników — licencja ${name.short}.`,
}));

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ license: string; question_id: string }>;
}) {
  // TODO: licenses and categories should be cached, too many waterfalls
  const { license: licenseUrl, question_id: questionId } = await params;

  const license = await db.query.licenses.findFirst({
    columns: { id: true },
    where: eq(licenses.url, licenseUrl),
  });

  if (!license) {
    notFound();
  }

  const [row] = await db
    .select({
      question: questions,
      categoryId: questionInstances.categoryId,
      hasExplanation: sql<boolean>`exists(
        select 1 from ${questionsToExplanations}
        where ${questionsToExplanations.questionId} = ${questions.id}
      )`.as("has_explanation"),
    })
    .from(questions)
    .innerJoin(
      questionInstances,
      eq(questions.id, questionInstances.questionId),
    )
    .innerJoin(categories, eq(questionInstances.categoryId, categories.id))
    .where(
      and(eq(questions.id, questionId), eq(categories.licenseId, license.id)),
    )
    .limit(1);

  if (!row) {
    notFound();
  }

  const category = await db.query.categories.findFirst({
    columns: { id: true, name: true, color: true },
    where: eq(categories.id, row.categoryId),
  });

  if (!category) {
    notFound();
  }

  return (
    <Main>
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${licenseUrl}/${QUESTIONS}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do bazy pytań
          </Link>
        </Button>
      </div>

      <Question
        question={row.question}
        category={category}
        hasExplanation={row.hasExplanation}
      />

      <QuestionComments questionId={questionId} />
    </Main>
  );
}
