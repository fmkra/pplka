import { notFound, permanentRedirect } from "next/navigation";
import { getLicense } from "~/app/_queries/cached";
import { questionHref } from "~/app/links";

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ license: string; question_id: string }>;
}) {
  const { license, question_id: questionId } = await params;

  if (!(await getLicense(license))) notFound();
  permanentRedirect(questionHref(questionId, license));
}
