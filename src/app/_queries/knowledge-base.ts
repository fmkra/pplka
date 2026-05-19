import { asc, isNotNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import type { KnowledgeBaseNode } from "~/server/api/routers/explanation";
import { db } from "~/server/db";
import { knowledgeBaseNodes } from "~/server/db/knowledgeBase";

export const buildTree = unstable_cache(async (): Promise<
  [
    Record<string, KnowledgeBaseNode[]>,
    Record<string, [KnowledgeBaseNode | null, KnowledgeBaseNode | null]>,
  ]
> => {
  const nodes = await db.query.knowledgeBaseNodes.findMany({
    orderBy: [asc(knowledgeBaseNodes.parentId), asc(knowledgeBaseNodes.order)],
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
}, ["knowledge_base_tree"]);

export const getAllKnowledgeBaseSlugs = () =>
  db.query.knowledgeBaseNodes.findMany({
    columns: {
      slug: true,
    },
    where: isNotNull(knowledgeBaseNodes.slug),
  });
