import { KnowledgeBaseExplanations } from "~/app/_components/knowledge-base/kb-explanations";

export const dynamic = "force-static";

export default async function KnowledgeBaseNodePage({
  params,
}: {
  params: Promise<{ kbn_id: string; license: string }>;
}) {
  const { kbn_id } = await params;

  return <KnowledgeBaseExplanations knowledgeBaseNodeId={kbn_id} />;
}
