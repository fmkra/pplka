import { Suspense } from "react";
import { buildTree } from "~/app/_queries/knowledge-base";
import { KnowledgeBaseOfflineShell } from "~/app/_components/knowledge-base/offline-shell";

export default async function KnowledgeBaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tree] = await buildTree();

  return (
    <Suspense fallback={null}>
      <KnowledgeBaseOfflineShell serverTree={tree}>
        {children}
      </KnowledgeBaseOfflineShell>
    </Suspense>
  );
}
