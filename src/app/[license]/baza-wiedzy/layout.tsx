"use client";

import { FolderNode } from "~/app/_components/knowledge-base/tree-node";

export default function KnowledgeBasePage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FolderNode node={null} />
      {children}
    </>
  );
}
