import { FolderNode } from "~/app/_components/knowledge-base/tree-node";
import Main from "~/app/_components/main";
import { buildTree } from "~/app/_queries/knowledge-base";

export default async function KnowledgeBaseTree({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tree] = await buildTree();

  return (
    <>
      <nav className="container mx-auto p-4 pb-0">
        <FolderNode node={null} tree={tree} />
      </nav>
      <Main className="pt-0">{children}</Main>
    </>
  );
}
