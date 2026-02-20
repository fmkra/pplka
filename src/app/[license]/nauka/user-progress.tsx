"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button, variants as buttonVariants } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { cn, conjugate } from "~/lib/utils";
import { LEARN } from "~/app/links";

type Category = {
  id: number;
  name: string;
  url: string;
  description: string | null;
  questionCount: number;
};

export default function CardUserProgress({
  licenseId,
  licenseUrl,
  category,
}: {
  licenseId: number;
  licenseUrl: string;
  category: Category;
}) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const { data, isLoading } = api.learning.getLicenseProgress.useQuery(
    {
      licenseId,
    },
    {
      enabled: isLoggedIn,
    },
  );

  const categoryProgress = data?.[category.id];

  if (isLoading && isLoggedIn) {
    return (
      <Skeleton
        className={cn("mt-auto h-9 w-full", buttonVariants.variant.default)}
      />
    );
  }

  return (
    <>
      {categoryProgress && isLoggedIn ? (
        <p className="text-muted-foreground mb-2 text-sm">
          Ukończono {categoryProgress.done} z {categoryProgress.total}{" "}
          {conjugate(categoryProgress.done, "pytania", "pytań", "pytań")}
        </p>
      ) : null}
      {isLoggedIn ? (
        <Button className="mt-auto w-full" asChild>
          <Link href={`/${licenseUrl}/${LEARN}/${category.url}`}>
            {categoryProgress ? "Kontynuuj naukę" : "Rozpocznij naukę"}
          </Link>
        </Button>
      ) : (
        <Button className="mt-auto w-full" disabled>
          {categoryProgress ? "Kontynuuj naukę" : "Rozpocznij naukę"}
        </Button>
      )}
    </>
  );
}
