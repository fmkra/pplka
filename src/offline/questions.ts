"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  catalogDb,
  questionPackageKey,
  removeQuestionCatalog,
} from "./catalog-db";
import {
  downloadQuestionCatalog,
  fetchCatalogManifest,
} from "./catalog-download";

export function useOfflineQuestions(licenseUrl: string) {
  const packageKey = questionPackageKey(licenseUrl);
  const installedPackage = useLiveQuery(
    () => catalogDb.packages.get(packageKey),
    [packageKey],
    null,
  );
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [onlineCheck, setOnlineCheck] = useState(0);

  useEffect(() => {
    const checkAgain = () => setOnlineCheck((value) => value + 1);
    window.addEventListener("online", checkAgain);
    return () => window.removeEventListener("online", checkAgain);
  }, []);

  useEffect(() => {
    if (!installedPackage || !navigator.onLine) {
      setUpdateAvailable(false);
      return;
    }
    let active = true;
    void fetchCatalogManifest()
      .then((manifest) => {
        if (active) {
          setUpdateAvailable(
            manifest.questions[licenseUrl]?.version !==
              installedPackage.version,
          );
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [installedPackage, licenseUrl, onlineCheck]);

  async function download() {
    setError(null);
    setProgress(10);
    try {
      await downloadQuestionCatalog(licenseUrl, setProgress);
      setUpdateAvailable(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Nie udało się pobrać pytań.",
      );
    } finally {
      setProgress(null);
    }
  }

  async function remove() {
    setError(null);
    await removeQuestionCatalog(licenseUrl);
  }

  return {
    download,
    remove,
    isReady: installedPackage !== null,
    isDownloaded: Boolean(installedPackage),
    updateAvailable,
    progress,
    error,
  };
}
