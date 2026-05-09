import { KnowledgeBaseExplanations } from "~/app/_components/knowledge-base/kb-explanations";
import { db } from "~/server/db";
import { licenses } from "~/server/db/license";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { knowledgeBaseNodes } from "~/server/db/knowledgeBase";
import { getExplanationsForKnowledgeBaseNode } from "~/server/api/routers/explanation";

export default async function KnowledgeBaseNodePage({
  params,
}: {
  params: Promise<{ kbn_id: string; license: string }>;
}) {
  const { kbn_id, license: licenseUrl } = await params;
  const license = (
    await db.select().from(licenses).where(eq(licenses.url, licenseUrl))
  )[0];

  if (!license) {
    notFound();
  }

  const data = await getExplanationsForKnowledgeBaseNode(kbn_id, license.id);

  return <KnowledgeBaseExplanations data={data} knowledgeBaseNodeId={kbn_id} />;
}

export async function generateStaticParams() {
  const allKnowledgeBaseNodes = await db
    .select({ id: knowledgeBaseNodes.id })
    .from(knowledgeBaseNodes);

  const allLicenses = await db.select({ url: licenses.url }).from(licenses);

  return allKnowledgeBaseNodes.flatMap((node) =>
    allLicenses.map((license) => ({
      kbn_id: node.id,
      license: license.url,
    })),
  );
}
