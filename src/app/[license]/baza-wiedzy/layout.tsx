import { asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { FolderNode } from "~/app/_components/knowledge-base/tree-node";
import Main from "~/app/_components/main";
import type { KnowledgeBaseNode } from "~/server/api/routers/explanation";
import { db } from "~/server/db";
import { knowledgeBaseNodes } from "~/server/db/knowledgeBase";

export const buildTree = unstable_cache(
  async (): Promise<
    [
      Record<string, KnowledgeBaseNode[]>,
      Record<string, [KnowledgeBaseNode | null, KnowledgeBaseNode | null]>,
    ]
  > => {
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
    const siblings = {} as Record<
      string,
      [KnowledgeBaseNode | null, KnowledgeBaseNode | null]
    >;

    function flattenTree(node: KnowledgeBaseNode): KnowledgeBaseNode[] {
      const c = children[node?.id ?? "root"] ?? [];
      if (c.length === 0 && node.type === "file" && node.slug) {
        return [node];
      }
      return c.flatMap(flattenTree);
    }

    const flatTree = children.root?.flatMap(flattenTree) ?? [];
    for (let i = 1; i < flatTree.length; i++) {
      const left = flatTree[i - 1]!;
      const right = flatTree[i]!;
      siblings[left.id] = [siblings[left.id]?.[0] ?? null, right];
      siblings[right.id] = [left, siblings[right.id]?.[0] ?? null];
    }

    return [children, siblings];
  },
);

export default async function KnowledgeBaseTree({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = (await buildTree())[0];

  return (
    <>
      <nav className="container mx-auto p-4 pb-0">
        <FolderNode node={null} tree={tree} />
      </nav>
      <Main className="pt-0">{children}</Main>
    </>
  );
}
