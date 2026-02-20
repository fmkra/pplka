"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { api } from "~/trpc/react";

export default function CategoryStartButton({
  categoryId,
  children,
  className,
  replaceLink = false,
}: {
  categoryId: number;
  children: React.ReactNode;
  className?: string;
  replaceLink?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const utils = api.useUtils();
  const { mutate, isPending } = api.exam.newExam.useMutation({
    onSuccess: async (id) => {
      router.push(`${replaceLink ? "." : pathname}/${id}`);
      // TODO: because invalidate happens before page is loaded, it immediately fetches new exams, so we should postpone it to page loading
      await utils.exam.getExamCount.invalidate();
      await utils.exam.getExams.invalidate();
    },
  });

  const handleStart = () => {
    if (!isLoggedIn) return;
    mutate({
      categoryId,
    });
  };

  return (
    <Button
      onClick={handleStart}
      disabled={isPending || !isLoggedIn}
      className={className}
    >
      {isPending ? <Spinner className="h-4 w-4" /> : children}
    </Button>
  );
}
