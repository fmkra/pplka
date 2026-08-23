"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { usePwaContext } from "~/app/_components/pwa-context";
import { createOfflineExam } from "~/offline/exam";
import { useOfflineQuestions } from "~/offline/questions";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { useExamMode } from "./exam-mode";

export default function CategoryStartButton({
  categoryId,
  children,
  className,
  containerClassName,
  replaceLink = false,
}: {
  categoryId: number;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  replaceLink?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { license } = useParams<{ license: string }>();
  const { data: session } = useSession();
  const { isOnline } = usePwaContext();
  const { isOfflineMode, withMode } = useExamMode();
  const offlineQuestions = useOfflineQuestions(license);
  const [isCreatingOffline, setIsCreatingOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoggedIn = !!session?.user;

  const utils = api.useUtils();
  const { mutate, isPending } = api.exam.newExam.useMutation({
    onSuccess: async (id) => {
      router.push(withMode(`${replaceLink ? "." : pathname}/${id}`));
      // TODO: because invalidate happens before page is loaded, it immediately fetches new exams, so we should postpone it to page loading
      await utils.exam.getExamCount.invalidate();
      await utils.exam.getExams.invalidate();
    },
  });

  const handleStart = async () => {
    setError(null);
    if (isOfflineMode) {
      setIsCreatingOffline(true);
      try {
        const id = await createOfflineExam(license, categoryId);
        if (!id) {
          setError("Najpierw pobierz pytania dla tej licencji.");
          return;
        }
        const href = withMode(`${replaceLink ? "." : pathname}/${id}`);
        if (isOnline) {
          router.push(href);
        } else {
          window.location.assign(href);
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Nie udało się rozpocząć egzaminu offline.",
        );
      } finally {
        setIsCreatingOffline(false);
      }
      return;
    }

    if (!isLoggedIn) return;
    mutate({
      categoryId,
    });
  };

  const isPendingAny = isPending || isCreatingOffline;
  const isDisabled = isOfflineMode
    ? isPendingAny || !offlineQuestions.isDownloaded
    : isPendingAny || !isOnline || !isLoggedIn;

  return (
    <div className={cn("w-full", containerClassName)}>
      <Button
        onClick={() => void handleStart()}
        disabled={isDisabled}
        className={cn("w-full", className)}
        title={
          isOfflineMode && !offlineQuestions.isDownloaded
            ? "Najpierw pobierz pytania dla tej licencji."
            : undefined
        }
      >
        {isPendingAny ? <Spinner className="h-4 w-4" /> : children}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
