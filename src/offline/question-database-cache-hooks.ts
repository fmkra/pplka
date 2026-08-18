"use client";

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";
import { createCacheFirstQueryHook } from "./cache-first-query";
import { catalogDb, questionPackageKey } from "./catalog-db";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

type QuestionsInput = RouterInputs["questionDatabase"]["getQuestions"] & {
  licenseId: number;
  licenseUrl: string;
};
type QuestionsOutput = RouterOutputs["questionDatabase"]["getQuestions"];

type QuestionsCountInput =
  RouterInputs["questionDatabase"]["getQuestionsCount"] & {
    licenseId: number;
    licenseUrl: string;
  };
type QuestionsCountOutput =
  RouterOutputs["questionDatabase"]["getQuestionsCount"];

async function getFilteredCachedEntries(
  licenseUrl: string,
  input: {
    categoryIds?: number[];
    search?: string;
    knowledgeBaseId: string | null;
  },
) {
  const packageKey = questionPackageKey(licenseUrl);
  const installedPackage = await catalogDb.packages.get(packageKey);
  if (!installedPackage) return null;

  const [questions, instances] = await Promise.all([
    catalogDb.questions.where("packageKey").equals(packageKey).toArray(),
    catalogDb.questionInstances
      .where("packageKey")
      .equals(packageKey)
      .toArray(),
  ]);
  const questionById = new Map(
    questions.map((question) => [question.id, question]),
  );
  const search = (input.search ?? "").trim().toLocaleLowerCase();
  const selectedCategories =
    input.categoryIds && input.categoryIds.length > 0
      ? new Set(input.categoryIds)
      : null;

  return instances
    .filter((instance) =>
      selectedCategories ? selectedCategories.has(instance.categoryId) : true,
    )
    .flatMap((instance) => {
      const question = questionById.get(instance.questionId);
      return question ? [{ instance, question }] : [];
    })
    .filter(({ question }) => {
      if (input.knowledgeBaseId === "any") return question.hasExplanation;
      if (input.knowledgeBaseId !== null) {
        return question.knowledgeBaseNodeIds.includes(input.knowledgeBaseId);
      }
      return true;
    })
    .filter(({ question }) => {
      if (!search) return true;
      return [
        question.externalId,
        question.question,
        question.answerCorrect,
        question.answerIncorrect1,
        question.answerIncorrect2,
        question.answerIncorrect3,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(search));
    })
    .sort((a, b) =>
      (a.question.externalId ?? "").localeCompare(
        b.question.externalId ?? "",
        undefined,
        { numeric: true, sensitivity: "base" },
      ),
    );
}

export const useCachedQuestionsCountQuery = createCacheFirstQueryHook<
  QuestionsCountInput,
  QuestionsCountOutput
>({
  getCacheKey: (input) => `question-count:${JSON.stringify(input)}`,
  getCachedData: async (input) => {
    const entries = await getFilteredCachedEntries(input.licenseUrl, input);
    return entries === null
      ? { hit: false }
      : { hit: true, data: entries.length };
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

export const useCachedQuestionsQuery = createCacheFirstQueryHook<
  QuestionsInput,
  QuestionsOutput
>({
  getCacheKey: (input) => `questions:${JSON.stringify(input)}`,
  getCachedData: async (input) => {
    const entries = await getFilteredCachedEntries(input.licenseUrl, input);
    if (entries === null) return { hit: false };
    const offset = input.offset ?? 0;
    const limit = input.limit ?? 20;
    return {
      hit: true,
      data: entries
        .slice(offset, offset + limit)
        .map(({ instance, question }) => ({
          question: {
            id: question.id,
            externalId: question.externalId,
            question: question.question,
            answerCorrect: question.answerCorrect,
            answerIncorrect1: question.answerIncorrect1,
            answerIncorrect2: question.answerIncorrect2,
            answerIncorrect3: question.answerIncorrect3,
            createdBy: null,
            createdAt: null,
            updatedAt: new Date(0),
          },
          questionInstance: {
            id: instance.id,
            categoryId: instance.categoryId,
            questionId: instance.questionId,
          },
          hasExplanation: question.hasExplanation,
        })),
    };
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
