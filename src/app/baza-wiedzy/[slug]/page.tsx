import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KnowledgeBaseExplanations } from "~/app/_components/knowledge-base/kb-explanations";
import {
  buildTree,
  getAllKnowledgeBaseSlugs,
} from "~/app/_queries/knowledge-base";
import { getKnowledgeBaseNodeData } from "~/server/api/routers/explanation";
import { db } from "~/server/db";
import { knowledgeBaseNodes } from "~/server/db/knowledgeBase";

const BASE_URL = "https://www.pplka.pl";

export const dynamicParams = false;

async function getKnowledgeBaseNode(slug: string) {
  return db.query.knowledgeBaseNodes.findFirst({
    columns: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: asc(knowledgeBaseNodes.order),
    where: eq(knowledgeBaseNodes.slug, decodeURIComponent(slug)),
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const node = await getKnowledgeBaseNode(slug);

  if (!node?.slug) notFound();

  const title = `${node.name} – baza wiedzy lotniczej`;
  const description = `${node.name}: materiał i wyjaśnienia pomagające przygotować się do egzaminów lotniczych.`;
  const canonical = `${BASE_URL}/baza-wiedzy/${encodeURIComponent(node.slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | PPLka.pl`,
      description,
      url: canonical,
    },
  };
}

export default async function KnowledgeBaseNodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const knowledgeBaseNode = await getKnowledgeBaseNode(slug);

  if (!knowledgeBaseNode) notFound();

  const [data, [, siblings]] = await Promise.all([
    getKnowledgeBaseNodeData(knowledgeBaseNode.id),
    buildTree(),
  ]);

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
  return allKnowledgeBaseNodes.map((node) => ({ slug: node.slug! }));
}
