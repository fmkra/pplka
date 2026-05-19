import { notFound } from "next/navigation";
import ExamList from "./exam_list";
import ExamStart from "./exam_start";
import LoginWarning from "~/app/_components/login-warning";
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
      <LoginWarning
        header="aby uzyskać dostęp do egzaminu"
        description="Musisz być zalogowany, aby rozpocząć egzamin i śledzić swój postęp."
      />
      <ExamStart licenseId={license.id} />
      <ExamList licenseId={license.id} categories={categories} />
    </Main>
  );
}

export async function generateStaticParams() {
  const licenses = await getLicenses();
  return licenses.map((license) => ({ license: license.url }));
}
