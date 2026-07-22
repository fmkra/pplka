import { notFound, permanentRedirect } from "next/navigation";
import { knowledgeBaseHref, LICENSES } from "~/app/links";

export default async function LegacyKnowledgeBaseNodePage({
  params,
}: {
  params: Promise<{ slug: string; license: string }>;
}) {
  const { slug, license } = await params;
  if (!LICENSES.includes(license)) notFound();
  permanentRedirect(knowledgeBaseHref(license, decodeURIComponent(slug)));
}
