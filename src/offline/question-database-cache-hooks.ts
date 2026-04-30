"use client";

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useEffect, useState } from "react";
import type { AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";
import { createCacheFirstQueryHook } from "./cache-first-query";
import {
  getCachedLicenseMeta,
  getCachedLicenseQuestions,
} from "./questions-cache";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

type QuestionsInput = RouterInputs["questionDatabase"]["getQuestions"] & {
  licenseId: number;
};
type QuestionsOutput = RouterOutputs["questionDatabase"]["getQuestions"];

type QuestionsCountInput = RouterInputs["questionDatabase"]["getQuestionsCount"] & {
  licenseId: number;
};
type QuestionsCountOutput = RouterOutputs["questionDatabase"]["getQuestionsCount"];

function isCacheable(knowledgeBaseId: string | null) {
  return knowledgeBaseId === null || knowledgeBaseId === "any";
}

async function getFilteredCachedEntries(
  licenseId: number,
  input: {
    categoryIds?: number[];
    search?: string;
    knowledgeBaseId: string | null;
  },
) {
  if (!isCacheable(input.knowledgeBaseId)) {
    return null;
  }

  const [meta, entries] = await Promise.all([
    getCachedLicenseMeta(licenseId),
    getCachedLicenseQuestions(licenseId),
  ]);

  if (!meta) {
    return null;
  }

  const search = (input.search ?? "").trim().toLocaleLowerCase();
  const selectedCategories =
    input.categoryIds && input.categoryIds.length > 0
      ? new Set(input.categoryIds)
      : null;

  return entries
    .filter((entry) =>
      selectedCategories ? selectedCategories.has(entry.categoryId) : true,
    )
    .filter((entry) => {
      if (input.knowledgeBaseId === "any") return entry.hasExplanation;
      return true;
    })
    .filter((entry) => {
      if (!search) return true;
      const q = entry.question;
      return [
        q.externalId,
        q.question,
        q.answerCorrect,
        q.answerIncorrect1,
        q.answerIncorrect2,
        q.answerIncorrect3,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(search));
    })
    .sort((a, b) => {
      const aExt = a.question.externalId ?? "";
      const bExt = b.question.externalId ?? "";
      return aExt.localeCompare(bExt, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
}

export const useCachedQuestionsCountQuery =
  createCacheFirstQueryHook<QuestionsCountInput, QuestionsCountOutput>({
    getCacheKey: (input) => `question-count:${JSON.stringify(input)}`,
    getCachedData: async (input) => {
      const cachedEntries = await getFilteredCachedEntries(input.licenseId, input);
      if (!cachedEntries) return { hit: false };
      return { hit: true, data: cachedEntries.length };
    },
    useServerQuery: (input, options) =>
      api.questionDatabase.getQuestionsCount.useQuery(
        {
          search: input.search,
          categoryIds: input.categoryIds,
          knowledgeBaseId: input.knowledgeBaseId,
        },
        options,
      ),
  });

export const useCachedQuestionsQuery =
  createCacheFirstQueryHook<QuestionsInput, QuestionsOutput>({
    getCacheKey: (input) => `questions:${JSON.stringify(input)}`,
    getCachedData: async (input) => {
      const cachedEntries = await getFilteredCachedEntries(input.licenseId, input);
      if (!cachedEntries) return { hit: false };

      const offset = input.offset ?? 0;
      const limit = input.limit ?? 20;
      const page = cachedEntries.slice(offset, offset + limit).map((entry) => ({
        question: entry.question,
        questionInstance: {
          id: entry.questionInstanceId,
          categoryId: entry.categoryId,
          questionId: entry.question.id,
        },
        hasExplanation: entry.hasExplanation,
      }));
      return { hit: true, data: page };
    },
    useServerQuery: (input, options) =>
      api.questionDatabase.getQuestions.useQuery(
        {
          search: input.search,
          categoryIds: input.categoryIds,
          knowledgeBaseId: input.knowledgeBaseId,
          limit: input.limit,
          offset: input.offset,
        },
        options,
      ),
  });

export function useCachedLicenseVersion(licenseId: number) {
  const [version, setVersion] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsReady(false);

    void getCachedLicenseMeta(licenseId).then((meta) => {
      if (cancelled) return;
      setVersion(meta?.version ?? null);
      setIsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [licenseId]);

  return {
    cachedVersion: version,
    isReady,
  };
}
