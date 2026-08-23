"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Progress } from "~/components/ui/progress";
import { useHydrated } from "~/lib/use-hydrated";
import { useOfflineQuestions } from "~/offline/questions";
import { useOfflineKnowledgeBase } from "~/offline/knowledge-base-cache";
import { OFFLINE_DOWNLOADS } from "~/app/links";
import { usePwaContext } from "./pwa-context";

const LICENSE_LABELS: Record<string, string> = {
  ppla: "PPL(A)",
  pplh: "PPL(H)",
  spl: "SPL",
  bpl: "BPL",
};

export function DownloadComponent({ licenseUrl }: { licenseUrl: string }) {
  const { isPwa } = usePwaContext();
  if (isPwa !== true) return null;

  return <PwaDownloadComponent licenseUrl={licenseUrl} />;
}

function PwaDownloadComponent({ licenseUrl }: { licenseUrl: string }) {
  const ppla = useOfflineQuestions("ppla");
  const pplh = useOfflineQuestions("pplh");
  const spl = useOfflineQuestions("spl");
  const bpl = useOfflineQuestions("bpl");
  const knowledgeBase = useOfflineKnowledgeBase();
  const questionsByLicense: Record<
    string,
    ReturnType<typeof useOfflineQuestions>
  > = { ppla, pplh, spl, bpl };
  const questions = questionsByLicense[licenseUrl] ?? ppla;
  const questionPackages = [ppla, pplh, spl, bpl];
  const allPackages = [knowledgeBase, ...questionPackages];
  const isHydrated = useHydrated();
  const [includeQuestions, setIncludeQuestions] = useState(true);
  const [includeKnowledgeBase, setIncludeKnowledgeBase] = useState(true);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [activePackage, setActivePackage] = useState<
    "questions" | "knowledge-base" | null
  >(null);

  if (!isHydrated || allPackages.some((item) => !item.isReady)) return null;

  const hasDownloadedPackage = allPackages.some((item) => item.isDownloaded);
  const hasUpdate = allPackages.some((item) => item.updateAvailable);
  const selectedCount = Number(includeQuestions) + Number(includeKnowledgeBase);
  const activeProgress =
    activePackage === "questions"
      ? questions.progress
      : activePackage === "knowledge-base"
        ? knowledgeBase.progress
        : null;
  const progressOffset =
    activePackage === "knowledge-base" && includeQuestions ? 50 : 0;
  const progressScale = selectedCount === 2 ? 0.5 : 1;
  const batchProgress = Math.round(
    progressOffset + (activeProgress ?? 0) * progressScale,
  );

  async function downloadSelected() {
    setIsBatchDownloading(true);
    try {
      if (includeQuestions) {
        setActivePackage("questions");
        await questions.download();
      }
      if (includeKnowledgeBase) {
        setActivePackage("knowledge-base");
        await knowledgeBase.download();
      }
    } finally {
      setActivePackage(null);
      setIsBatchDownloading(false);
    }
  }

  async function updateAllDownloaded() {
    setIsUpdatingAll(true);
    try {
      for (const item of allPackages) {
        if (item.isDownloaded && item.updateAvailable) {
          await item.download();
        }
      }
    } finally {
      setIsUpdatingAll(false);
    }
  }

  const downloadedLabels = [
    knowledgeBase.isDownloaded ? "baza wiedzy" : null,
    ...Object.entries(questionsByLicense).map(([license, controller]) =>
      controller.isDownloaded
        ? `pytania ${LICENSE_LABELS[license] ?? license.toUpperCase()}`
        : null,
    ),
  ].filter((label): label is string => Boolean(label));
  const packageError = allPackages.find((item) => item.error)?.error;

  return (
    <div className="mx-2 mt-2">
      <Card className="bg-primary/5 border-primary/20 mx-auto mb-4 max-w-xl">
        <CardContent>
          {!hasDownloadedPackage || isBatchDownloading ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Download className="text-primary mt-0.5 size-5 shrink-0" />
                <div>
                  <h2 className="font-semibold">Materiały dostępne offline</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Wybierz materiały, które chcesz zapisać na tym urządzeniu.
                  </p>
                </div>
              </div>

              <div className="bg-background/70 space-y-3 rounded-lg border p-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <Checkbox
                    checked={includeQuestions}
                    disabled={isBatchDownloading}
                    onCheckedChange={(checked) =>
                      setIncludeQuestions(checked === true)
                    }
                    aria-label="Pytania dla wybranej licencji"
                  />
                  <span>
                    <span className="block font-medium">
                      Pytania{" "}
                      {LICENSE_LABELS[licenseUrl] ?? licenseUrl.toUpperCase()}
                    </span>
                    <span className="text-muted-foreground">
                      Baza pytań dla wybranej licencji
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <Checkbox
                    checked={includeKnowledgeBase}
                    disabled={isBatchDownloading}
                    onCheckedChange={(checked) =>
                      setIncludeKnowledgeBase(checked === true)
                    }
                    aria-label="Baza wiedzy"
                  />
                  <span>
                    <span className="block font-medium">Baza wiedzy</span>
                    <span className="text-muted-foreground">
                      Materiały, wyjaśnienia i ilustracje
                    </span>
                  </span>
                </label>
              </div>

              {isBatchDownloading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {activePackage === "questions"
                        ? "Pobieranie pytań…"
                        : "Pobieranie bazy wiedzy…"}
                    </span>
                    <span>{batchProgress}%</span>
                  </div>
                  <Progress value={batchProgress} />
                </div>
              ) : null}

              {packageError ? (
                <p className="text-destructive text-sm">{packageError}</p>
              ) : null}

              <Button
                className="w-full"
                disabled={isBatchDownloading || selectedCount === 0}
                onClick={() => void downloadSelected()}
              >
                <Download className="size-4" />
                {isBatchDownloading ? "Pobieranie…" : "Pobierz zaznaczone"}
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              {hasUpdate ? (
                <RefreshCw className="mt-0.5 size-5 shrink-0 text-amber-600" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">
                  {hasUpdate
                    ? "Dostępna jest aktualizacja materiałów offline"
                    : "Materiały są dostępne offline"}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Pobrano: {downloadedLabels.join(", ")}.
                </p>
                {packageError ? (
                  <p className="text-destructive mt-3 text-sm">
                    {packageError}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/${OFFLINE_DOWNLOADS}`} prefetch={false}>
                      Zarządzaj pobranymi
                    </Link>
                  </Button>
                  {hasUpdate ? (
                    <Button
                      disabled={isUpdatingAll || !navigator.onLine}
                      onClick={() => void updateAllDownloaded()}
                    >
                      {isUpdatingAll ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      {isUpdatingAll
                        ? "Aktualizowanie…"
                        : "Aktualizuj wszystkie"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
