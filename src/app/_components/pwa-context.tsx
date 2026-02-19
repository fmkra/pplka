"use client";
import { useState, useEffect, useRef, useContext, createContext } from "react";

/** Browser event for PWA install prompt; not in default DOM types. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type PwaContextType = {
  isOnline: boolean;
  /** True when the browser has sent beforeinstallprompt (install prompt can be shown). */
  canInstall: boolean;
  /** Call when user agrees to install; triggers the browser install UI. */
  promptInstall: () => Promise<{ outcome: "accepted" | "dismissed" } | null>;
};

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export const usePwaContext = () => {
  const context = useContext(PwaContext);
  if (context === undefined) {
    throw new Error(
      "usePwaContext must be used within a PwaContextProvider",
    );
  }
  return context;
};

export default function PwaContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

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
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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
    <PwaContext.Provider
      value={{ isOnline, canInstall, promptInstall }}
    >
      {children}
    </PwaContext.Provider>
  );
}
