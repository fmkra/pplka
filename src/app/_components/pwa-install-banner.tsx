"use client";

import { useState } from "react";
import { usePwaContext } from "./pwa-context";
import { Button } from "~/components/ui/button";
import { Download, X } from "lucide-react";

export function PwaInstallBanner() {
  const { canInstall, promptInstall } = usePwaContext();
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!canInstall || dismissed) return null;

  const handleInstall = async () => {
    setIsLoading(true);
    await promptInstall();
    setIsLoading(false);
  };

  return (
    <div className="bg-primary/10 border-primary/20 text-foreground mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">Pobierz aplikację PPLka</p>
          <p className="text-muted-foreground text-sm">
            Zainstaluj aplikację i korzystaj z nauki w trybie offline — bez
            internetu.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleInstall}
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? "Otwieranie…" : "Zainstaluj"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={() => setDismissed(true)}
          aria-label="Zamknij"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
