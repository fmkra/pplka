"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { ExplanationElement } from "~/app/_components/knowledge-base/md-render";
import {
  catalogDb,
  KNOWLEDGE_BASE_PACKAGE,
  removeKnowledgeBaseCatalog,
} from "./catalog-db";
import {
  downloadKnowledgeBaseCatalog,
  fetchCatalogManifest,
  KNOWLEDGE_BASE_ASSET_CACHE,
} from "./catalog-download";

export function useOfflineKnowledgeBase() {
  const installedPackage = useLiveQuery(
    () => catalogDb.packages.get(KNOWLEDGE_BASE_PACKAGE),
    [],
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
            manifest.knowledgeBase.version !== installedPackage.version,
          );
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [installedPackage, onlineCheck]);

  async function download() {
    setError(null);
    setProgress(10);
    try {
      await downloadKnowledgeBaseCatalog(setProgress);
      setUpdateAvailable(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Nie udało się pobrać bazy wiedzy.",
      );
    } finally {
      setProgress(null);
    }
  }

  async function remove() {
    setError(null);
    await removeKnowledgeBaseCatalog();
    if ("caches" in window) await caches.delete(KNOWLEDGE_BASE_ASSET_CACHE);
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

export async function getCachedQuestionExplanations(
  questionId: string,
): Promise<ExplanationElement[] | null> {
  if (!(await catalogDb.packages.get(KNOWLEDGE_BASE_PACKAGE))) return null;
  const links = await catalogDb.questionExplanations
    .where("questionId")
    .equals(questionId)
    .sortBy("order");
  const explanations = await catalogDb.explanations.bulkGet(
    links.map((link) => link.explanationId),
  );
  return links.flatMap((link, index) => {
    const explanation = explanations[index];
    return explanation
      ? [{ explanation, isExtraResource: link.isExtraResource }]
      : [];
  });
}
