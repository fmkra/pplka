import { asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { FolderNode } from "~/app/_components/knowledge-base/tree-node";
import Main from "~/app/_components/main";
import type { KnowledgeBaseNode } from "~/server/api/routers/explanation";
import { db } from "~/server/db";
import { knowledgeBaseNodes } from "~/server/db/knowledgeBase";

const buildTree = unstable_cache(
  async (): Promise<Record<string, KnowledgeBaseNode[]>> => {
    const nodes = await db.query.knowledgeBaseNodes.findMany({
      orderBy: [
        asc(knowledgeBaseNodes.parentId),
        asc(knowledgeBaseNodes.order),
      ],
    });
    const children = {} as Record<string, KnowledgeBaseNode[]>;
    for (const node of nodes) {
      children[node.parentId ?? "root"] = [
        ...(children[node.parentId ?? "root"] ?? []),
        node,
      ];
    }
    return children;
  },
);

export default async function KnowledgeBaseTree({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = await buildTree();

  return (
    <>
      <nav className="container mx-auto p-4 pb-0">
        <FolderNode node={null} tree={tree} />
      </nav>
      <Main className="pt-0">{children}</Main>
    </>
  );
}
