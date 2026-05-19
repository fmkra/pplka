import { getLicenses } from "~/app/_queries/cached";
import { metadataBuilder } from "~/app/seo";

export const generateMetadata = metadataBuilder((url, name) => ({
  title: `Baza wiedzy - ${name.short}`,
  description: `Przeglądaj materiały edukacyjne, notatki i podsumowania do nauki przed egzaminem na licencję ${name.short}.`,
}));

export default function Page() {
  return null;
}

export async function generateStaticParams() {
  const licensesData = await getLicenses();
  return licensesData.map((license) => ({
    license: license.url,
  }));
}
