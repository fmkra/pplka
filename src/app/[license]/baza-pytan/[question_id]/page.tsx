import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Main from "~/app/_components/main";
import { metadataBuilder } from "~/app/seo";
import { QUESTIONS } from "~/app/links";
import { Question } from "../question";
import { QuestionComments } from "./question-comments";
import { Button } from "~/components/ui/button";
import { getCategoryById, getLicense } from "~/app/_queries/cached";
import { getQuestionForLicense } from "~/app/_queries/question-base";

export const generateMetadata = metadataBuilder((_url, name) => ({
  title: `Pytanie - Baza pytań - ${name.short}`,
  description: `Szczegóły pytania egzaminacyjnego i komentarze użytkowników — licencja ${name.short}.`,
}));

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ license: string; question_id: string }>;
}) {
  const { license: licenseUrl, question_id: questionId } = await params;

  const license = await getLicense(licenseUrl);
  if (!license) {
    notFound();
  }

  const row = await getQuestionForLicense(questionId, license.id);
  if (!row) {
    notFound();
  }

  const category = await getCategoryById(row.categoryId);
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
