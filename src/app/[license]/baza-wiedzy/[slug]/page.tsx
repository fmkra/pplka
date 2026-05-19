import { asc, eq, isNotNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { KnowledgeBaseExplanations } from "~/app/_components/knowledge-base/kb-explanations";
import { getLicenses } from "~/app/_queries/cached";
import {
  buildTree,
  getAllKnowledgeBaseSlugs,
} from "~/app/_queries/knowledge-base";
import { getExplanationsForKnowledgeBaseNode } from "~/server/api/routers/explanation";
import { db } from "~/server/db";
import { knowledgeBaseNodes } from "~/server/db/knowledgeBase";
import { licenses } from "~/server/db/license";

export default async function KnowledgeBaseNodePage({
  params,
}: {
  params: Promise<{ slug: string; license: string }>;
}) {
  const { slug, license: licenseUrl } = await params;
  const license = await db.query.licenses.findFirst({
    columns: {
      id: true,
    },
    where: eq(licenses.url, licenseUrl),
  });

  if (!license) {
    notFound();
  }

  const knowledgeBaseNode = await db.query.knowledgeBaseNodes.findFirst({
    columns: {
      id: true,
    },
    orderBy: asc(knowledgeBaseNodes.order),
    where: eq(knowledgeBaseNodes.slug, decodeURIComponent(slug)),
  });

  if (!knowledgeBaseNode) {
    notFound();
  }

  const data = await getExplanationsForKnowledgeBaseNode(
    knowledgeBaseNode.id,
    license.id,
  );

  const [, siblings] = await buildTree();

  return (
    <KnowledgeBaseExplanations
      data={data}
      knowledgeBaseNodeId={knowledgeBaseNode.id}
      siblings={siblings[knowledgeBaseNode.id] ?? [null, null]}
    />
  );
}

export async function generateStaticParams() {
  const allKnowledgeBaseNodes = await getAllKnowledgeBaseSlugs();

  const allLicenses = await getLicenses();

  return allKnowledgeBaseNodes.flatMap((node) =>
    allLicenses.map((license) => ({
      slug: node.slug,
      license: license.url,
    })),
  );
}
