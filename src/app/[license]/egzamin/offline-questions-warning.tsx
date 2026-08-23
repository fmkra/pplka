"use client";

import { HardDriveDownload } from "lucide-react";
import Link from "next/link";
import { usePwaContext } from "~/app/_components/pwa-context";
import { OFFLINE_DOWNLOADS } from "~/app/links";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { useOfflineQuestions } from "~/offline/questions";
import { useExamMode } from "./exam-mode";

export default function OfflineQuestionsWarning({
  licenseUrl,
}: {
  licenseUrl: string;
}) {
  const { isOnline, isPwa } = usePwaContext();
  const { isOfflineMode } = useExamMode();
  const questions = useOfflineQuestions(licenseUrl);

  if (
    isPwa !== true ||
    !isOfflineMode ||
    !questions.isReady ||
    questions.isDownloaded
  ) {
    return null;
  }

  return (
    <Card className="mt-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-3">
            <HardDriveDownload className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Pobierz pytania, aby rozpocząć egzamin offline
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {isOnline
                  ? "Tryb offline korzysta z pytań zapisanych wcześniej na tym urządzeniu. Pobierz pakiet dla wybranej licencji."
                  : "Na tym urządzeniu nie ma pobranych pytań dla wybranej licencji. Połącz się z internetem i pobierz je przed rozpoczęciem egzaminu."}
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/${OFFLINE_DOWNLOADS}`} prefetch={false}>
              Pobrane materiały
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
