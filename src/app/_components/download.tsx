"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { usePwaContext } from "./pwa-context";
import { useHydrated } from "~/lib/use-hydrated";
import { useOfflineQuestions } from "~/offline/questions";
import { useOfflineKnowledgeBase } from "~/offline/knowledge-base-cache";

function PackageControls({
  description,
  downloadedDescription,
  downloadLabel,
  isDownloaded,
  progress,
  error,
  onDownload,
  onRemove,
}: {
  description: string;
  downloadedDescription: string;
  downloadLabel: string;
  isDownloaded: boolean;
  progress: number | null;
  error: string | null;
  onDownload: () => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const isDownloading = progress !== null;
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        {isDownloaded ? downloadedDescription : description}
      </p>
      {isDownloading ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pobieranie w toku…</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button
        onClick={() => void (isDownloaded ? onRemove() : onDownload())}
        disabled={isDownloading}
        variant={isDownloaded ? "outline" : "default"}
        className="w-full"
      >
        {isDownloaded ? "Usuń pobrany pakiet" : downloadLabel}
      </Button>
    </div>
  );
}

export function DownloadComponent({ licenseUrl }: { licenseUrl: string }) {
  const questions = useOfflineQuestions(licenseUrl);
  const knowledgeBase = useOfflineKnowledgeBase();
  const isHydrated = useHydrated();
  const { isPwa } = usePwaContext();

  if (!isHydrated || !isPwa || !questions.isReady || !knowledgeBase.isReady) {
    return null;
  }

  return (
    <div className="mx-2 mt-2">
      <Card className="bg-primary/5 border-primary/20 mx-auto mb-4 max-w-xl">
        <CardContent className="space-y-5">
          <PackageControls
            description="Pobierz pytania dla tej licencji, aby korzystać z bazy pytań bez internetu."
            downloadedDescription="Pytania dla tej licencji są dostępne offline."
            downloadLabel="Pobierz pytania offline"
            isDownloaded={questions.isDownloaded}
            progress={questions.progress}
            error={questions.error}
            onDownload={questions.download}
            onRemove={questions.remove}
          />
          <div className="border-t pt-5">
            <PackageControls
              description="Pobierz wspólną bazę wiedzy wraz z ilustracjami i wyjaśnieniami."
              downloadedDescription="Baza wiedzy i wyjaśnienia są dostępne offline."
              downloadLabel="Pobierz bazę wiedzy offline"
              isDownloaded={knowledgeBase.isDownloaded}
              progress={knowledgeBase.progress}
              error={knowledgeBase.error}
              onDownload={knowledgeBase.download}
              onRemove={knowledgeBase.remove}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
