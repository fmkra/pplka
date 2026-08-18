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
import type { CatalogManifest } from "./catalog-schema";

export function useOfflineQuestions(licenseUrl: string) {
  const packageKey = questionPackageKey(licenseUrl);
  const installedPackage = useLiveQuery(
    () => catalogDb.packages.get(packageKey),
    [packageKey],
    null,
  );
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestManifest, setLatestManifest] = useState<CatalogManifest | null>(
    null,
  );
  const [onlineCheck, setOnlineCheck] = useState(0);

  useEffect(() => {
    const checkAgain = () => setOnlineCheck((value) => value + 1);
    window.addEventListener("online", checkAgain);
    return () => window.removeEventListener("online", checkAgain);
  }, []);

  useEffect(() => {
    if (!installedPackage || !navigator.onLine) {
      return;
    }
    let active = true;
    void fetchCatalogManifest()
      .then((manifest) => {
        if (active) setLatestManifest(manifest);
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
      setLatestManifest(await fetchCatalogManifest());
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Nie udało się pobrać pytań.",
      );
      return false;
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
    installedPackage,
    latestEntry: latestManifest?.questions[licenseUrl],
    updateAvailable: Boolean(
      installedPackage &&
        latestManifest?.questions[licenseUrl] &&
        latestManifest.questions[licenseUrl].version !==
          installedPackage.version,
    ),
    progress,
    error,
  };
}
