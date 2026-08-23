import { notFound } from "next/navigation";
import ExamList from "./exam_list";
import ExamStart from "./exam_start";
import ExamLoginWarning from "./exam-login-warning";
import OfflineExamList from "./offline-exam-list";
import { ExamModeListHint, ExamModeSelector } from "./exam-mode";
import OfflineQuestionsWarning from "./offline-questions-warning";
import { metadataBuilder } from "~/app/seo";
import Main from "~/app/_components/main";
import {
  getLicense,
  getLicenseCategories,
  getLicenses,
} from "~/app/_queries/cached";

export const generateMetadata = metadataBuilder((url, name) => ({
  title: `Egzamin próbny - ${name.short}`,
  description: `Przygotuj się do egzaminu ULC. Symulator egzaminu na ${name.short} z pytaniami z oficjalnej bazy.`,
}));

export default async function ExamsPage({
  params,
}: {
  params: Promise<{ license: string }>;
}) {
  const { license: licenseUrl } = await params;

  const license = await getLicense(licenseUrl);
  if (!license) {
    notFound();
  }

  const categories = await getLicenseCategories(license.id);

  return (
    <Main>
      <ExamLoginWarning />
      <ExamModeSelector />
      <OfflineQuestionsWarning licenseUrl={licenseUrl} />
      <ExamStart licenseId={license.id} />
      <OfflineExamList licenseUrl={licenseUrl} categories={categories} />
      <ExamList licenseId={license.id} categories={categories} />
      <ExamModeListHint />
    </Main>
  );
}

export async function generateStaticParams() {
  const licenses = await getLicenses();
  return licenses.map((license) => ({ license: license.url }));
}
