"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { api } from "~/trpc/react";
import {
  catalogDb,
  type OfflineExamAnswer,
  type OfflineExamAttempt,
  questionPackageKey,
} from "./catalog-db";

const OFFLINE_EXAM_PREFIX = "offline-";

export type ExamViewData = {
  source: "offline" | "server";
  licenseUrl?: string;
  attempt: {
    id: string;
    categoryId: number;
    startedAt: Date;
    deadlineTime: Date;
    finishedAt: Date | null;
  };
  questions: Array<{
    id: string;
    questionInstanceId: string;
    questionId: string;
    externalId: string | null;
    question: string;
    answerCorrect: string;
    answerIncorrect1: string;
    answerIncorrect2: string;
    answerIncorrect3: string;
    hasExplanation: boolean;
    answer: OfflineExamAnswer;
  }>;
};

export function isOfflineExamId(examId: string) {
  return examId.startsWith(OFFLINE_EXAM_PREFIX);
}

function shuffled<T>(values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [
      result[randomIndex]!,
      result[index]!,
    ];
  }
  return result;
}

export async function createOfflineExam(
  licenseUrl: string,
  categoryId: number,
) {
  const packageKey = questionPackageKey(licenseUrl);
  const [installedPackage, category, instances] = await Promise.all([
    catalogDb.packages.get(packageKey),
    catalogDb.categories.get(`${packageKey}:${categoryId}`),
    catalogDb.questionInstances
      .where("[packageKey+categoryId]")
      .equals([packageKey, categoryId])
      .toArray(),
  ]);

  if (!installedPackage || !category) return null;
  if (instances.length < category.examQuestionCount) {
    throw new Error("Pobrany pakiet nie zawiera wystarczającej liczby pytań.");
  }

  const selectedInstances = shuffled(instances).slice(
    0,
    category.examQuestionCount,
  );
  const questions = await catalogDb.questions.bulkGet(
    selectedInstances.map((instance) => `${packageKey}:${instance.questionId}`),
  );
  const questionById = new Map(
    questions.flatMap((question) =>
      question ? [[question.id, question] as const] : [],
    ),
  );

  if (questionById.size !== selectedInstances.length) {
    throw new Error("Pobrany pakiet pytań jest niekompletny.");
  }

  const id = `${OFFLINE_EXAM_PREFIX}${crypto.randomUUID()}`;
  const startedAt = new Date();
  const attempt: OfflineExamAttempt = {
    id,
    licenseUrl,
    categoryId,
    categoryName: category.name,
    examTime: category.examTime,
    startedAt,
    deadlineTime: new Date(startedAt.getTime() + category.examTime * 1000),
    finishedAt: null,
    questions: selectedInstances.map((instance) => {
      const question = questionById.get(instance.questionId)!;
      return {
        id: `${id}:${instance.id}`,
        questionInstanceId: instance.id,
        questionId: question.id,
        externalId: question.externalId,
        question: question.question,
        answerCorrect: question.answerCorrect,
        answerIncorrect1: question.answerIncorrect1,
        answerIncorrect2: question.answerIncorrect2,
        answerIncorrect3: question.answerIncorrect3,
        hasExplanation: question.hasExplanation,
        answer: null,
      };
    }),
  };

  await catalogDb.offlineExamAttempts.add(attempt);
  return id;
}

export async function saveOfflineExamProgress({
  examAttemptId,
  questionInstanceId,
  answer,
  finishExam,
}: {
  examAttemptId: string;
  questionInstanceId?: string;
  answer?: OfflineExamAnswer;
  finishExam: boolean;
}) {
  await catalogDb.transaction("rw", catalogDb.offlineExamAttempts, async () => {
    const attempt = await catalogDb.offlineExamAttempts.get(examAttemptId);
    if (!attempt) throw new Error("Nie znaleziono egzaminu offline.");

    if (questionInstanceId && answer !== undefined) {
      const question = attempt.questions.find(
        (item) => item.questionInstanceId === questionInstanceId,
      );
      if (!question) throw new Error("Nie znaleziono pytania w egzaminie.");
      question.answer = answer;
    }
    if (finishExam && attempt.finishedAt === null) {
      attempt.finishedAt = new Date();
    }
    await catalogDb.offlineExamAttempts.put(attempt);
  });
}

function localAttemptToView(attempt: OfflineExamAttempt): ExamViewData {
  return {
    source: "offline",
    licenseUrl: attempt.licenseUrl,
    attempt: {
      id: attempt.id,
      categoryId: attempt.categoryId,
      startedAt: new Date(attempt.startedAt),
      deadlineTime: new Date(attempt.deadlineTime),
      finishedAt: attempt.finishedAt ? new Date(attempt.finishedAt) : null,
    },
    questions: attempt.questions.map((question) => ({ ...question })),
  };
}

export function useExam(examId: string) {
  const isOffline = isOfflineExamId(examId);
  const offlineAttempt = useLiveQuery(
    async () =>
      isOffline
        ? ((await catalogDb.offlineExamAttempts.get(examId)) ?? null)
        : null,
    [examId, isOffline],
    undefined,
  );
  const serverQuery = api.exam.getExam.useQuery(
    { examAttemptId: examId },
    { enabled: !isOffline },
  );

  if (isOffline) {
    return {
      data:
        offlineAttempt === null
          ? null
          : offlineAttempt
            ? localAttemptToView(offlineAttempt)
            : undefined,
      isLoading: offlineAttempt === undefined,
    };
  }

  const serverData = serverQuery.data;
  if (!serverData) {
    return { data: serverData, isLoading: serverQuery.isLoading };
  }

  const [attempt, questions] = serverData;
  return {
    data: {
      source: "server",
      attempt,
      questions: questions.map((examQuestion) => ({
        id: String(examQuestion.id),
        questionInstanceId: examQuestion.questionInstanceId,
        questionId: examQuestion.questionInstance.question.id,
        externalId: examQuestion.questionInstance.question.externalId,
        question: examQuestion.questionInstance.question.question,
        answerCorrect: examQuestion.questionInstance.question.answerCorrect,
        answerIncorrect1:
          examQuestion.questionInstance.question.answerIncorrect1,
        answerIncorrect2:
          examQuestion.questionInstance.question.answerIncorrect2,
        answerIncorrect3:
          examQuestion.questionInstance.question.answerIncorrect3,
        hasExplanation:
          examQuestion.questionInstance.question.questionsToExplanations
            .length > 0,
        answer: examQuestion.answer,
      })),
    } satisfies ExamViewData,
    isLoading: false,
  };
}

export function useOfflineExamAttempts(
  licenseUrl: string,
  categoryIds: number[],
) {
  const categoryKey = [...categoryIds].sort((a, b) => a - b).join(",");
  return useLiveQuery(async () => {
    const attempts = await catalogDb.offlineExamAttempts
      .where("licenseUrl")
      .equals(licenseUrl)
      .toArray();
    const selectedCategories = new Set(categoryIds);
    return attempts
      .filter(
        (attempt) =>
          selectedCategories.size === 0 ||
          selectedCategories.has(attempt.categoryId),
      )
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }, [licenseUrl, categoryKey]);
}
