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
    <div className="bg-primary/10 border-primary/20 text-foreground mx-auto mb-8 flex max-w-3xl items-center justify-between gap-4 rounded-lg border p-4 max-[30rem]:flex-col">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <Download className="text-primary h-5 w-5" />
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
          size="default"
          onClick={handleInstall}
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? "Otwieranie…" : "Zainstaluj"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-9 shrink-0 max-[30rem]:hidden"
          onClick={() => setDismissed(true)}
          aria-label="Zamknij"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="default"
          variant="outline"
          className="hidden shrink-0 bg-none max-[30rem]:block"
          onClick={() => setDismissed(true)}
        >
          Zamknij
        </Button>
      </div>
    </div>
  );
}
