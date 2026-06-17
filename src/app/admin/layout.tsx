import Link from "next/link";
import { notFound } from "next/navigation";
import Main from "~/app/_components/main";
import { ADMIN, COMMENTS, FEEDBACK } from "~/app/links";
import { Button } from "~/components/ui/button";
import { auth } from "~/server/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    notFound();
  }

  return (
    <Main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-muted-foreground text-sm">
            Aktywność użytkowników i jakość treści.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${ADMIN}`}>Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${ADMIN}/${FEEDBACK}`}>Feedback</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${ADMIN}/${COMMENTS}`}>Komentarze</Link>
          </Button>
        </nav>
      </div>
      {children}
    </Main>
  );
}
