import { FolderNode } from "~/app/_components/knowledge-base/tree-node";
import Main from "~/app/_components/main";
import { metadataBuilder } from "~/app/seo";
import { db } from "~/server/db";

export const generateMetadata = metadataBuilder((url, name) => ({
  title: `Baza wiedzy - ${name.short}`,
  description: `Przeglądaj materiały edukacyjne, notatki i podsumowania do nauki przed egzaminem na licencję ${name.short}.`,
}));

export default function Page() {
  return (
    <Main>
      <FolderNode node={null} />
    </Main>
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
