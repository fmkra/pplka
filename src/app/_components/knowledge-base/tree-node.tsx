"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "~/components/ui/accordion";
import type { KnowledgeBaseNode } from "~/server/api/routers/explanation";
import { usePathname } from "next/navigation";
import { KNOWLEDGE_BASE } from "~/app/links";

export function TreeNodes({
  tree,
  parentId,
}: {
  tree: Record<string, KnowledgeBaseNode[]>;
  parentId: string | null;
}) {
  const nodes = tree[parentId ?? "root"];
  if (!nodes) return null;

  return (
    <div className="flex flex-col gap-1">
      {nodes.map((node) =>
        node.type == "file" ? (
          <FileNode key={node.id} node={node} />
        ) : (
          <FolderNode key={node.id} node={node} tree={tree} />
        ),
      )}
    </div>
  );
}

function FileNode({ node }: { node: KnowledgeBaseNode }) {
  const pathname = usePathname();
  const license = pathname.split("/")[1];

  return (
    <Link
      href={`/${license}/${KNOWLEDGE_BASE}/${node.slug}`}
      className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm no-underline shadow-sm transition hover:no-underline"
    >
      <span className="text-muted-foreground">📄</span>
      <span className="truncate">{node.name}</span>
    </Link>
  );
}
export function FolderNode({
  node,
  tree,
}: {
  node: KnowledgeBaseNode | null;
  tree: Record<string, KnowledgeBaseNode[]>;
}) {
  const [open, setOpen] = useState<string>("");

  return (
    <Accordion type="single" collapsible value={open} onValueChange={setOpen}>
      <AccordionItem value={node?.id ?? "root"}>
        <AccordionTrigger className="border-border bg-muted/60 hover:bg-muted rounded-md border px-3 py-2 text-sm font-medium">
          <div className="flex w-full items-center gap-2 text-left">
            <span className="text-muted-foreground">📁</span>
            <span className="truncate">{node?.name ?? "Baza wiedzy"}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-1">
          <div className="border-border ml-4 border-l pl-4">
            <TreeNodes parentId={node?.id ?? null} tree={tree} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
