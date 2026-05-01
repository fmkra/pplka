"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { usePwaContext } from "./pwa-context";
import { useHydrated } from "~/lib/use-hydrated";
import { useOfflineQuestions } from "~/offline/questions";

export function DownloadComponent({ licenseId }: { licenseId: number }) {
  const offline = useOfflineQuestions();
  const isHydrated = useHydrated();
  const { isPwa } = usePwaContext();
  const status = offline.isLicenseDownloaded(licenseId);
  const isDownloaded = status === true;
  const progress = typeof status === "number" ? status : isDownloaded ? 100 : 0;
  const isDownloading = typeof status === "number" && status < 100;

  if (!isHydrated || status === undefined || !isPwa) {
    return null;
  }

  return (
    <Card className="bg-primary/5 border-primary/20 mx-auto mb-4 max-w-md">
      <CardContent className="space-y-4">
        {isDownloaded ? (
          <>
            <p className="text-muted-foreground text-sm">
              Pobrałeś pytania dla tej licencji. W trybie offline możesz
              korzystać z bazy pytań.
            </p>
            <Button
              onClick={() => offline.clearLicense(licenseId)}
              disabled={isDownloading}
              className="w-full"
            >
              Usuń pobrane pytania
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              Możesz pobrać pytania dla tej licencji, aby korzystac z bazy pytań
              bez internetu.
            </p>

            {isDownloading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Pobieranie w toku. Nie zamykaj tej strony.
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Button
              onClick={() => offline.downloadLicense(licenseId)}
              disabled={isDownloading}
              className="mx-auto block w-full max-w-xs"
            >
              {isDownloaded
                ? "Pobrano"
                : isDownloading
                  ? "Pobieranie..."
                  : "Pobierz pytania offline"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
