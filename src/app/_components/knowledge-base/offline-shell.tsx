"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { FolderNode } from "./tree-node";
import { KnowledgeBaseFooter } from "./knowledge-base-footer";
import { KnowledgeBaseExplanations } from "./kb-explanations";
import Main from "~/app/_components/main";
import {
  catalogDb,
  KNOWLEDGE_BASE_PACKAGE,
  type LocalKnowledgeBaseNode,
} from "~/offline/catalog-db";
import type { KnowledgeBaseNode } from "~/server/api/routers/explanation";

type KnowledgeBaseTree = Record<string, KnowledgeBaseNode[]>;

function buildLocalTree(nodes: LocalKnowledgeBaseNode[]) {
  const tree: KnowledgeBaseTree = {};
  for (const node of nodes) {
    const parentId = node.parentId ?? "root";
    tree[parentId] = [...(tree[parentId] ?? []), node].sort(
      (a, b) => a.order - b.order,
    );
  }

  const files: KnowledgeBaseNode[] = [];
  function flatten(node: KnowledgeBaseNode) {
    const children = tree[node.id] ?? [];
    if (node.type === "file" && node.slug && children.length === 0) {
      files.push(node);
      return;
    }
    children.forEach(flatten);
  }
  (tree.root ?? []).forEach(flatten);

  const siblings: Record<
    string,
    [KnowledgeBaseNode | null, KnowledgeBaseNode | null]
  > = {};
  files.forEach((node, index) => {
    siblings[node.id] = [files[index - 1] ?? null, files[index + 1] ?? null];
  });
  return { tree, siblings };
}

function currentSlug() {
  if (typeof window === "undefined") return null;
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments[0] === "baza-wiedzy" && segments[1]
    ? decodeURIComponent(segments[1])
    : null;
}

export function KnowledgeBaseOfflineShell({
  serverTree,
  children,
}: {
  serverTree: KnowledgeBaseTree;
  children: React.ReactNode;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setSlug(currentSlug());
    update();
    window.addEventListener("popstate", update);
    window.addEventListener("pplka:local-navigation", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("pplka:local-navigation", update);
    };
  }, []);

  const localData = useLiveQuery(
    async () => {
      const installed = await catalogDb.packages.get(KNOWLEDGE_BASE_PACKAGE);
      if (!installed) return { installed: false as const };
      const [nodes, explanations, nodeLinks, counts] = await Promise.all([
        catalogDb.knowledgeBaseNodes.toArray(),
        catalogDb.explanations.toArray(),
        catalogDb.nodeExplanations.toArray(),
        catalogDb.questionCounts.toArray(),
      ]);
      return {
        installed: true as const,
        nodes,
        explanations,
        nodeLinks,
        counts,
      };
    },
    [],
    null,
  );

  const navigateLocally = useCallback((href: string) => {
    window.history.pushState(null, "", href);
    window.dispatchEvent(new Event("pplka:local-navigation"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const renderedLocalData = useMemo(() => {
    if (!localData?.installed) return null;
    const structure = buildLocalTree(localData.nodes);
    const node = localData.nodes.find((candidate) => candidate.slug === slug);
    if (!node) return { ...structure, article: null };
    const explanationById = new Map(
      localData.explanations.map((explanation) => [
        explanation.id,
        explanation,
      ]),
    );
    const explanations = localData.nodeLinks
      .filter((link) => link.nodeId === node.id)
      .sort((a, b) => a.order - b.order)
      .flatMap((link) => {
        const explanation = explanationById.get(link.explanationId);
        return explanation ? [{ explanation }] : [];
      });
    const questionCounts = Object.fromEntries(
      localData.counts
        .filter((count) => count.nodeId === node.id)
        .map((count) => [count.licenseUrl, count.count]),
    );
    return {
      ...structure,
      article: { node, explanations, questionCounts },
    };
  }, [localData, slug]);

  const usesLocalCatalog = Boolean(renderedLocalData);
  const tree = renderedLocalData?.tree ?? serverTree;

  return (
    <>
      <nav className="container mx-auto p-4 pb-0">
        <Suspense fallback={null}>
          <FolderNode
            node={null}
            tree={tree}
            onNavigate={usesLocalCatalog ? navigateLocally : undefined}
          />
        </Suspense>
      </nav>
      <Main className="pt-0">
        {renderedLocalData ? (
          renderedLocalData.article ? (
            <KnowledgeBaseExplanations
              data={{
                explanations: renderedLocalData.article.explanations,
                questionCounts: renderedLocalData.article.questionCounts,
              }}
              knowledgeBaseNodeId={renderedLocalData.article.node.id}
              siblings={
                renderedLocalData.siblings[
                  renderedLocalData.article.node.id
                ] ?? [null, null]
              }
              onNavigate={navigateLocally}
            />
          ) : null
        ) : (
          children
        )}
      </Main>
      <Suspense fallback={null}>
        <KnowledgeBaseFooter />
      </Suspense>
    </>
  );
}

declare global {
  interface WindowEventMap {
    "pplka:local-navigation": Event;
  }
}
