import { eq, isNotNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { KnowledgeBaseExplanations } from "~/app/_components/knowledge-base/kb-explanations";
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
    where: eq(knowledgeBaseNodes.slug, decodeURIComponent(slug)),
  });

  if (!knowledgeBaseNode) {
    notFound();
  }

  const data = await getExplanationsForKnowledgeBaseNode(
    knowledgeBaseNode.id,
    license.id,
  );

  return (
    <KnowledgeBaseExplanations
      data={data}
      knowledgeBaseNodeId={knowledgeBaseNode.id}
    />
  );
}

export async function generateStaticParams() {
  const allKnowledgeBaseNodes = await db.query.knowledgeBaseNodes.findMany({
    columns: {
      slug: true,
    },
    where: isNotNull(knowledgeBaseNodes.slug),
  });

  const allLicenses = await db.query.licenses.findMany({
    columns: {
      url: true,
    },
  });

  return allKnowledgeBaseNodes.flatMap((node) =>
    allLicenses.map((license) => ({
      slug: node.slug,
      license: license.url,
    })),
  );
}
