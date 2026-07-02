"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { createContext, useContext } from "react";
import { Button, variants as buttonVariants } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { cn, conjugate } from "~/lib/utils";
import { LEARN } from "~/app/links";

type LicenseProgress = Record<number, { done: number; total: number }>;

const UserProgressContext = createContext<{
  data: LicenseProgress | undefined;
  isLoading: boolean;
  isLoggedIn: boolean;
} | null>(null);

export function UserProgressProvider({
  licenseId,
  children,
}: {
  licenseId: number;
  children: React.ReactNode;
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

  return (
    <UserProgressContext.Provider value={{ data, isLoading, isLoggedIn }}>
      {children}
    </UserProgressContext.Provider>
  );
}

type Category = {
  id: number;
  name: string;
  url: string;
  description: string | null;
  questionCount: number;
};

export default function CardUserProgress({
  licenseUrl,
  category,
}: {
  licenseUrl: string;
  category: Category;
}) {
  const progress = useContext(UserProgressContext);
  const data = progress?.data;
  const isLoading = progress?.isLoading ?? false;
  const isLoggedIn = progress?.isLoggedIn ?? false;

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
          <Link href={`/${licenseUrl}/${LEARN}/${category.url}`} prefetch={false}>
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
