"use client";
import { useState, useEffect, useRef, useContext, createContext } from "react";

/** Browser event for PWA install prompt; not in default DOM types. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type PwaContextType = {
  /** True when user has connection with internet */
  isOnline: boolean;
  /** True when app is running in standalone (installed PWA) mode. */
  isPwa: boolean | undefined;
  /** True when the browser has sent beforeinstallprompt (install prompt can be shown). */
  canInstall: boolean;
  /** Call when user agrees to install; triggers the browser install UI. */
  promptInstall: () => Promise<{ outcome: "accepted" | "dismissed" } | null>;
};

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export const usePwaContext = () => {
  const context = useContext(PwaContext);
  if (context === undefined) {
    throw new Error("usePwaContext must be used within a PwaContextProvider");
  }
  return context;
};

export default function PwaContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [isPwa, setIsPwa] = useState<boolean | undefined>(undefined);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const updatePwaMode = () => {
      const isStandalone = mediaQuery.matches;
      const isIosStandalone = Boolean(navigator.standalone);
      setIsPwa(isStandalone || isIosStandalone);
    };

    updatePwaMode();
    mediaQuery.addEventListener("change", updatePwaMode);
    window.addEventListener("appinstalled", updatePwaMode);
    return () => {
      mediaQuery.removeEventListener("change", updatePwaMode);
      window.removeEventListener("appinstalled", updatePwaMode);
    };
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<{
    outcome: "accepted" | "dismissed";
  } | null> => {
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) return null;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      deferredPromptRef.current = null;
      setCanInstall(false);
    }
    return { outcome };
  };

  return (
    <PwaContext.Provider value={{ isOnline, isPwa, canInstall, promptInstall }}>
      {children}
    </PwaContext.Provider>
  );
}
