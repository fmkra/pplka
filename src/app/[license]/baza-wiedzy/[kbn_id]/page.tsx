import { KnowledgeBaseExplanations } from "~/app/_components/knowledge-base/explanations";

export default async function KnowledgeBaseNodePage({
  params,
}: {
  params: Promise<{ kbn_id: string }>;
}) {
  const { kbn_id } = await params;

  return <KnowledgeBaseExplanations knowledgeBaseNodeId={kbn_id} />;
}
