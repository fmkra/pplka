"use client";

import { CircleHelp } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { usePwaContext } from "~/app/_components/pwa-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

type ExamModeContextValue = {
  isOfflineMode: boolean;
  setOfflineMode: (offline: boolean) => void;
  withMode: (href: string) => string;
};

type ExamMode = "offline" | "online";

const EXAM_MODE_PARAM = "tryb";

function readModeFromUrl(): ExamMode | null {
  if (typeof window === "undefined") return null;
  const value = new URL(window.location.href).searchParams.get(EXAM_MODE_PARAM);
  return value === "offline" || value === "online" ? value : null;
}

function writeModeToUrl(mode: ExamMode) {
  const url = new URL(window.location.href);
  url.searchParams.set(EXAM_MODE_PARAM, mode);
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function removeModeFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(EXAM_MODE_PARAM)) return;
  url.searchParams.delete(EXAM_MODE_PARAM);
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

const ExamModeContext = createContext<ExamModeContextValue | undefined>(
  undefined,
);

export function ExamModeProvider({ children }: { children: React.ReactNode }) {
  const { isOnline, isPwa } = usePwaContext();
  const { status } = useSession();
  const [mode, setMode] = useState<ExamMode | null>(null);
  const [hasReadUrl, setHasReadUrl] = useState(false);
  const defaultMode: ExamMode =
    status === "authenticated" ? "online" : "offline";
  const supportsOfflineMode = isPwa === true;
  const selectedMode = !supportsOfflineMode
    ? "online"
    : !isOnline
      ? "offline"
      : (mode ?? defaultMode);
  const isOfflineMode = selectedMode === "offline";

  useEffect(() => {
    const syncModeFromUrl = () => setMode(readModeFromUrl());
    syncModeFromUrl();
    setHasReadUrl(true);
    window.addEventListener("popstate", syncModeFromUrl);
    return () => window.removeEventListener("popstate", syncModeFromUrl);
  }, []);

  useEffect(() => {
    if (!hasReadUrl || isPwa === undefined) return;
    if (!supportsOfflineMode) {
      if (mode !== "online") setMode("online");
      removeModeFromUrl();
      return;
    }
    if (!isOnline) {
      if (mode !== "offline") {
        setMode("offline");
        writeModeToUrl("offline");
      }
      return;
    }
    if (mode === null && status !== "loading") {
      setMode(defaultMode);
      writeModeToUrl(defaultMode);
    }
  }, [
    defaultMode,
    hasReadUrl,
    isOnline,
    isPwa,
    mode,
    status,
    supportsOfflineMode,
  ]);

  const setOfflineMode = useCallback(
    (offline: boolean) => {
      if (!isOnline || !supportsOfflineMode) return;
      const nextMode = offline ? "offline" : "online";
      setMode(nextMode);
      writeModeToUrl(nextMode);
    },
    [isOnline, supportsOfflineMode],
  );
  const withMode = useCallback(
    (href: string) =>
      supportsOfflineMode
        ? `${href}${href.includes("?") ? "&" : "?"}${EXAM_MODE_PARAM}=${selectedMode}`
        : href,
    [selectedMode, supportsOfflineMode],
  );
  const value = useMemo(
    () => ({ isOfflineMode, setOfflineMode, withMode }),
    [isOfflineMode, setOfflineMode, withMode],
  );

  return (
    <ExamModeContext.Provider value={value}>
      {children}
    </ExamModeContext.Provider>
  );
}

export function useExamMode() {
  const context = useContext(ExamModeContext);
  if (!context) {
    throw new Error("useExamMode must be used within ExamModeProvider");
  }
  return context;
}

export function ExamModeSelector() {
  const { isOnline, isPwa } = usePwaContext();
  const { isOfflineMode, setOfflineMode } = useExamMode();

  if (isPwa !== true) return null;

  return (
    <div className="flex justify-end">
      <div className="bg-muted/60 flex items-center gap-2 rounded-full border px-3 py-2">
        <span className="text-sm font-medium">Tryb offline</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Wyjaśnienie trybów egzaminu"
              className="text-muted-foreground hover:text-foreground cursor-help"
            >
              <CircleHelp className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-80" sideOffset={6}>
            <p>
              W trybie offline egzamin jest zapisywany tylko na tym urządzeniu i
              nie trafia na konto. W trybie online egzamin jest zapisywany na
              koncie i możesz go kontynuować na innym urządzeniu.
            </p>
          </TooltipContent>
        </Tooltip>
        <button
          type="button"
          role="switch"
          aria-checked={isOfflineMode}
          aria-label="Tryb offline"
          disabled={!isOnline}
          onClick={() => setOfflineMode(!isOfflineMode)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
            isOfflineMode ? "bg-primary" : "bg-input",
          )}
        >
          <span
            className={cn(
              "pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform",
              isOfflineMode ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
    </div>
  );
}

export function ExamModeListHint() {
  const { isOnline, isPwa } = usePwaContext();
  const { isOfflineMode, setOfflineMode } = useExamMode();

  if (isPwa !== true) return null;

  if (!isOnline) {
    return (
      <p className="text-muted-foreground mt-4 text-center text-sm">
        Połącz się z internetem, aby sprawdzić egzaminy zapisane na koncie.
      </p>
    );
  }

  return (
    <p className="text-muted-foreground mt-4 text-center text-sm">
      Nie możesz znaleźć rozpoczętego egzaminu?{" "}
      <button
        type="button"
        onClick={() => setOfflineMode(!isOfflineMode)}
        className="text-primary cursor-pointer underline underline-offset-4"
      >
        {isOfflineMode
          ? "Sprawdź egzaminy zapisane na koncie"
          : "Sprawdź egzaminy offline"}
      </button>
    </p>
  );
}
