import { notFound } from "next/navigation";
import QuestionsPageClient from "./client";
import { db } from "~/server/db";
import { metadataBuilder } from "~/app/seo";

export const generateMetadata = metadataBuilder((url, name) => ({title: `Baza pytań - ${name.short}`, description: `Pełna baza pytań egzaminacyjnych na licencję ${name.short}. Przeglądaj, filtruj po kategoriach i wyszukuj pytania z egzaminu ULC.`}))

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ license: string }>;
}) {
  const { license: licenseUrl } = await params;
  const license = await db.query.licenses.findFirst({
    columns: {
      id: true,
    },
    where: (licenses, { eq }) => eq(licenses.url, licenseUrl),
  });

  if (!license) {
    notFound();
  }

  const categoryList = await db.query.categories.findMany({
    columns: {
      id: true,
      name: true,
      color: true,
    },
    where: (categories, { eq }) => eq(categories.licenseId, license.id),
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Baza pytań</h1>
        <p className="text-muted-foreground">
          Przeglądaj listę pytań i sprawdź czy umiesz na nie odpowiedzieć.
        </p>
      </div>

      <QuestionsPageClient categories={categoryList} />
    </>
  );
}

export async function generateStaticParams() {
  const licensesData = await db.query.licenses.findMany({
    columns: {
      url: true,
    },
  });
  return licensesData.map((license) => ({
    license: license.url,
  }));
}
