import { cn } from "~/lib/utils";

export default function Main({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("container mx-auto flex-1 p-4", className)}>
      {children}
    </main>
  );
}
