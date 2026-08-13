"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  catalogDb,
  questionPackageKey,
  removeQuestionCatalog,
} from "./catalog-db";
import { downloadQuestionCatalog } from "./catalog-download";

export function useOfflineQuestions(licenseUrl: string) {
  const packageKey = questionPackageKey(licenseUrl);
  const installedPackage = useLiveQuery(
    () => catalogDb.packages.get(packageKey),
    [packageKey],
    null,
  );
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setError(null);
    setProgress(10);
    try {
      await downloadQuestionCatalog(licenseUrl, setProgress);
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
    progress,
    error,
  };
}
