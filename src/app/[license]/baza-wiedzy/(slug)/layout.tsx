import { FolderNode } from "~/app/_components/knowledge-base/tree-node";
import Main from "~/app/_components/main";

export default function KnowledgeBaseSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="container mx-auto p-4 pb-0">
        <FolderNode node={null} />
      </nav>
      <Main className="pt-0">{children}</Main>
    </>
  );
}
