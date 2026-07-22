"use client";

import { ChevronRight, FileText, FolderClosed, FolderOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KNOWLEDGE_BASE_LICENSE,
  knowledgeBaseHref,
  LICENSES,
} from "~/app/links";
import { cn } from "~/lib/utils";
import type { KnowledgeBaseNode } from "~/server/api/routers/explanation";

type KnowledgeBaseTree = Record<string, KnowledgeBaseNode[]>;

function getNodePath(
  node: KnowledgeBaseNode | undefined,
  nodeById: Map<string, KnowledgeBaseNode>,
) {
  const path: KnowledgeBaseNode[] = [];
  let current = node;

  while (current) {
    path.unshift(current);
    current = current.parentId ? nodeById.get(current.parentId) : undefined;
  }

  return path;
}

function useInitialFolderPath(tree: KnowledgeBaseTree) {
  const pathname = usePathname();

  return useMemo(() => {
    const nodeById = new Map<string, KnowledgeBaseNode>();
    const nodes = Object.values(tree).flat();

    for (const node of nodes) {
      nodeById.set(node.id, node);
    }

    const slug = decodeURIComponent(pathname.split("/").at(-1) ?? "");
    const currentNode = nodes.find((node) => node.slug === slug);

    return getNodePath(currentNode, nodeById)
      .filter((node) => node.type === "folder")
      .map((node) => node.id);
  }, [pathname, tree]);
}

export function FolderNode({
  tree,
}: {
  node: KnowledgeBaseNode | null;
  tree: KnowledgeBaseTree;
}) {
  const initialFolderPath = useInitialFolderPath(tree);
  const [openPath, setOpenPath] = useState<string[]>(initialFolderPath);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousColumnCountRef = useRef(0);

  useEffect(() => {
    setOpenPath(initialFolderPath);
  }, [initialFolderPath]);

  const columns = useMemo(() => {
    const result: Array<{
      parentId: string | null;
      selectedId: string | undefined;
    }> = [
      {
        parentId: null,
        selectedId: openPath[0],
      },
    ];

    for (let i = 0; i < openPath.length; i++) {
      const parentId = openPath[i]!;
      const children = tree[parentId] ?? [];
      if (children.length === 0) continue;

      result.push({
        parentId,
        selectedId: openPath[i + 1],
      });
    }

    return result;
  }, [openPath, tree]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    if (columns.length > previousColumnCountRef.current) {
      scrollContainer.scrollTo({
        left: scrollContainer.scrollWidth,
        behavior: "smooth",
      });
    }

    previousColumnCountRef.current = columns.length;
  }, [columns.length]);

  function handleFolderClick(parentId: string | null, folderId: string) {
    setOpenPath((currentPath) => {
      const existingIndex = currentPath.indexOf(folderId);
      if (existingIndex >= 0) {
        return currentPath.slice(0, existingIndex);
      }

      const parentIndex = parentId ? currentPath.indexOf(parentId) : -1;
      return [...currentPath.slice(0, parentIndex + 1), folderId];
    });
  }

  return (
    <div
      ref={scrollContainerRef}
      className="border-border bg-card w-full overflow-x-auto rounded-md border shadow-sm"
    >
      <div className="flex w-max min-w-full">
        {columns.map((column, index) => (
          <Column
            key={column.parentId ?? "root"}
            parentId={column.parentId}
            selectedId={column.selectedId}
            tree={tree}
            isFirst={index === 0}
            onFolderClick={handleFolderClick}
          />
        ))}
      </div>
    </div>
  );
}

function Column({
  isFirst,
  onFolderClick,
  parentId,
  selectedId,
  tree,
}: {
  isFirst: boolean;
  onFolderClick: (parentId: string | null, folderId: string) => void;
  parentId: string | null;
  selectedId: string | undefined;
  tree: KnowledgeBaseTree;
}) {
  const nodes = tree[parentId ?? "root"] ?? [];

  return (
    <section
      className={cn(
        "border-border flex w-72 flex-none flex-col sm:w-80",
        !isFirst && "border-l",
      )}
    >
      <div className="max-h-[calc(100vh-7rem)] min-h-48 overflow-y-auto p-2">
        {nodes.length === 0 ? (
          <p className="text-muted-foreground px-2 py-8 text-center text-sm">
            Brak elementów
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {nodes.map((node) =>
              node.type === "folder" ? (
                <FolderRow
                  key={node.id}
                  node={node}
                  isOpen={selectedId === node.id}
                  hasChildren={(tree[node.id] ?? []).length > 0}
                  onClick={() => onFolderClick(parentId, node.id)}
                />
              ) : (
                <FileRow key={node.id} node={node} />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function FolderRow({
  hasChildren,
  isOpen,
  node,
  onClick,
}: {
  hasChildren: boolean;
  isOpen: boolean;
  node: KnowledgeBaseNode;
  onClick: () => void;
}) {
  const Icon = isOpen ? FolderOpen : FolderClosed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition",
        isOpen &&
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
      )}
      aria-expanded={isOpen}
    >
      <Icon className="size-4 flex-none" />
      <span className="min-w-0 flex-1 truncate">{node.name}</span>
      {hasChildren && (
        <ChevronRight
          className={cn(
            "size-4 flex-none",
            isOpen ? "text-primary-foreground" : "text-muted-foreground",
          )}
        />
      )}
    </button>
  );
}

function FileRow({ node }: { node: KnowledgeBaseNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedLicense = searchParams.get(KNOWLEDGE_BASE_LICENSE);
  const license =
    requestedLicense && LICENSES.includes(requestedLicense)
      ? requestedLicense
      : LICENSES[0];
  const href = knowledgeBaseHref(license, node.slug ?? undefined);
  const isActive =
    decodeURIComponent(pathname.split("/").at(-1) ?? "") === node.slug;

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground flex h-10 items-center gap-2 rounded-md px-2 text-sm no-underline transition hover:no-underline",
        isActive &&
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
      )}
    >
      <FileText className="size-4 flex-none" />
      <span className="min-w-0 flex-1 truncate">{node.name}</span>
    </Link>
  );
}
