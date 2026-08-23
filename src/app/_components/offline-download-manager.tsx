"use client";

import { Database, BookOpen, Download, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { useHydrated } from "~/lib/use-hydrated";
import { useOfflineKnowledgeBase } from "~/offline/knowledge-base-cache";
import { useOfflineQuestions } from "~/offline/questions";
import { usePwaContext } from "./pwa-context";

type PackageController = ReturnType<typeof useOfflineQuestions>;

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value?: string) {
  if (!value) return "brak danych";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "brak danych"
    : dateFormatter.format(date);
}

function PackageCard({
  title,
  description,
  icon: Icon,
  controller,
}: {
  title: string;
  description: string;
  icon: typeof Database;
  controller: PackageController;
}) {
  const installed = controller.installedPackage;
  const latest = controller.latestEntry;
  const isBusy = controller.progress !== null;
  const installedVersionDate =
    installed?.sourceUpdatedAt ??
    (latest && latest.version === installed?.version
      ? latest.updatedAt
      : undefined);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Icon className="text-primary mt-0.5 size-5 shrink-0" />
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {installed ? (
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Wersja materiałów: </span>
              {formatDate(installedVersionDate)}
            </p>
            <p>
              <span className="text-muted-foreground">
                Pobrano na urządzenie:{" "}
              </span>
              {formatDate(installed.installedAt)}
            </p>
            {controller.updateAvailable ? (
              <p className="font-medium text-amber-700">
                Nowsza wersja: {formatDate(latest?.updatedAt)}
              </p>
            ) : (
              <p className="font-medium text-green-700">Pakiet jest aktualny</p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nie pobrano na tym urządzeniu.
          </p>
        )}

        {isBusy ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {installed ? "Aktualizowanie…" : "Pobieranie…"}
              </span>
              <span>{controller.progress}%</span>
            </div>
            <Progress value={controller.progress ?? 0} />
          </div>
        ) : null}

        {controller.error ? (
          <p className="text-destructive text-sm">{controller.error}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {!installed || controller.updateAvailable ? (
            <Button
              disabled={isBusy || !navigator.onLine}
              onClick={() => void controller.download()}
            >
              {installed ? (
                <RefreshCw className="size-4" />
              ) : (
                <Download className="size-4" />
              )}
              {installed ? "Aktualizuj" : "Pobierz"}
            </Button>
          ) : null}
          {installed ? (
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={() => void controller.remove()}
            >
              <Trash2 className="size-4" />
              Usuń
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function OfflineDownloadManager() {
  const { isPwa } = usePwaContext();
  if (isPwa !== true) return null;

  return <PwaOfflineDownloadManager />;
}

function PwaOfflineDownloadManager() {
  const isHydrated = useHydrated();
  const knowledgeBase = useOfflineKnowledgeBase();
  const ppla = useOfflineQuestions("ppla");
  const pplh = useOfflineQuestions("pplh");
  const spl = useOfflineQuestions("spl");
  const bpl = useOfflineQuestions("bpl");
  const packages = [knowledgeBase, ppla, pplh, spl, bpl];

  if (!isHydrated || packages.some((item) => !item.isReady)) return null;

  const updateCount = packages.filter((item) => item.updateAvailable).length;

  return (
    <div className="space-y-6">
      {updateCount > 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <RefreshCw className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">
              {updateCount === 1
                ? "Dostępna jest aktualizacja jednego pakietu."
                : `Dostępne są aktualizacje ${updateCount} pakietów.`}
            </p>
            <p className="mt-1 text-sm">
              Możesz aktualizować pakiety osobno. Dotychczasowe dane pozostają
              dostępne do zakończenia pobierania.
            </p>
          </div>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Baza wiedzy</h2>
        <PackageCard
          title="Baza wiedzy"
          description="Materiały, wyjaśnienia oraz ilustracje dla wszystkich licencji."
          icon={BookOpen}
          controller={knowledgeBase}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Bazy pytań</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <PackageCard
            title="PPL(A)"
            description="Pytania do licencji pilota samolotowego."
            icon={Database}
            controller={ppla}
          />
          <PackageCard
            title="PPL(H)"
            description="Pytania do licencji pilota śmigłowcowego."
            icon={Database}
            controller={pplh}
          />
          <PackageCard
            title="SPL"
            description="Pytania do licencji pilota szybowcowego."
            icon={Database}
            controller={spl}
          />
          <PackageCard
            title="BPL"
            description="Pytania do licencji pilota balonowego."
            icon={Database}
            controller={bpl}
          />
        </div>
      </section>
    </div>
  );
}
