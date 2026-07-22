import { Suspense } from "react";
import { KnowledgeBaseFooter } from "~/app/_components/knowledge-base/knowledge-base-footer";
import { FolderNode } from "~/app/_components/knowledge-base/tree-node";
import Main from "~/app/_components/main";
import { buildTree } from "~/app/_queries/knowledge-base";

export default async function KnowledgeBaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tree] = await buildTree();

  return (
    <>
      <nav className="container mx-auto p-4 pb-0">
        <Suspense fallback={null}>
          <FolderNode node={null} tree={tree} />
        </Suspense>
      </nav>
      <Main className="pt-0">{children}</Main>
      <Suspense fallback={null}>
        <KnowledgeBaseFooter />
      </Suspense>
    </>
  );
}
