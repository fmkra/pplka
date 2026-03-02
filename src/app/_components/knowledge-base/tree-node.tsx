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
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import { usePathname } from "next/navigation";
import { KNOWLEDGE_BASE } from "~/app/links";

export function TreeLoading() {
  return (
    <div
      className="flex flex-col gap-1"
      aria-busy="true"
      aria-label="Ładowanie"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border-border flex items-center gap-2 rounded-md border px-3 py-2"
        >
          <Skeleton className="h-5 w-4 shrink-0 rounded" />
          <Skeleton className="h-4 max-w-[120px] flex-1" />
        </div>
      ))}
    </div>
  );
}

export function TreeNodes({ parentId }: { parentId: string | null }) {
  const { data } = api.explanation.getKnowledgeBaseNodes.useQuery({
    parentId,
  });

  if (!data) return <TreeLoading />;

  return (
    <div className="flex flex-col gap-1">
      {data.map(({ node }) =>
        node.type == "file" ? (
          <FileNode key={node.id} node={node} />
        ) : (
          <FolderNode key={node.id} node={node} />
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
      href={`/${license}/${KNOWLEDGE_BASE}/${node.id}`}
      className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm no-underline shadow-sm transition hover:no-underline"
    >
      <span className="text-muted-foreground">📄</span>
      <span className="truncate">{node.name}</span>
    </Link>
  );
}
export function FolderNode({ node }: { node: KnowledgeBaseNode | null }) {
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
            <TreeNodes parentId={node?.id ?? null} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
