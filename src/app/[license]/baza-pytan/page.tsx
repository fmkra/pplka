import { notFound } from "next/navigation";
import QuestionsPageClient from "./client";
import { metadataBuilder } from "~/app/seo";
import { Suspense } from "react";
import Main from "~/app/_components/main";
import {
  getLicense,
  getLicenseCategories,
  getLicenses,
} from "~/app/_queries/cached";

export const generateMetadata = metadataBuilder((url, name) => ({
  title: `Baza pytań - ${name.short}`,
  description: `Pełna baza pytań egzaminacyjnych na licencję ${name.short}. Przeglądaj, filtruj po kategoriach i wyszukuj pytania z egzaminu ULC.`,
}));

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ license: string }>;
}) {
  const { license: licenseUrl } = await params;

  const license = await getLicense(licenseUrl);
  if (!license) {
    notFound();
  }

  const categoryList = await getLicenseCategories(license.id);

  return (
    <Main>
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Baza pytań</h1>
        <p className="text-muted-foreground">
          Przeglądaj listę pytań i sprawdź czy umiesz na nie odpowiedzieć.
        </p>
      </div>

      {/* TODO: is this loading ever showing? */}
      <Suspense fallback={<div>Loading...</div>}>
        <QuestionsPageClient categories={categoryList} licenseId={license.id} />
      </Suspense>
    </Main>
  );
}

export async function generateStaticParams() {
  const licensesData = await getLicenses();
  return licensesData.map((license) => ({
    license: license.url,
  }));
}
