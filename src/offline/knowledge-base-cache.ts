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
import type { CatalogManifest } from "./catalog-schema";

export function useOfflineKnowledgeBase() {
  const installedPackage = useLiveQuery(
    () => catalogDb.packages.get(KNOWLEDGE_BASE_PACKAGE),
    [],
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
  }, [installedPackage, onlineCheck]);

  async function download() {
    setError(null);
    setProgress(10);
    try {
      await downloadKnowledgeBaseCatalog(setProgress);
      setLatestManifest(await fetchCatalogManifest());
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Nie udało się pobrać bazy wiedzy.",
      );
      return false;
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
    installedPackage,
    latestEntry: latestManifest?.knowledgeBase,
    updateAvailable: Boolean(
      installedPackage &&
        latestManifest?.knowledgeBase &&
        latestManifest.knowledgeBase.version !== installedPackage.version,
    ),
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
