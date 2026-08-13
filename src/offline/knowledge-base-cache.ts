"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { ExplanationElement } from "~/app/_components/knowledge-base/md-render";
import {
  catalogDb,
  KNOWLEDGE_BASE_PACKAGE,
  removeKnowledgeBaseCatalog,
} from "./catalog-db";
import {
  downloadKnowledgeBaseCatalog,
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

  async function download() {
    setError(null);
    setProgress(10);
    try {
      await downloadKnowledgeBaseCatalog(setProgress);
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
