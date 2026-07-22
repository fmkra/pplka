import { notFound, permanentRedirect } from "next/navigation";
import { knowledgeBaseHref, LICENSES } from "~/app/links";

export default async function LegacyKnowledgeBasePage({
  params,
}: {
  params: Promise<{ license: string }>;
}) {
  const { license } = await params;
  if (!LICENSES.includes(license)) notFound();
  permanentRedirect(knowledgeBaseHref(license));
}
