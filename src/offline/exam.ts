"use client";

import type { ExamAttempt } from "~/lib/types";
import type { GetExamResponse } from "~/server/api/routers/exam";
import { useOfflineStore } from "~/stores";
import { api } from "~/trpc/react";

export function useExam() {
  const offlineStore = useOfflineStore();

  /// Returns exam data either from local storage (for offline exams) or server for normal mode
  /// Undefined - loading
  /// Null = doesn't exist
  function getExam(examId: string): GetExamResponse | undefined {
    const offlineAttempt = offlineStore.examAttempts[examId];
    if (offlineAttempt) {
      // TODO: get questions from local storage
      return [offlineAttempt, []] as const;
    }

    const { data } = api.exam.getExam.useQuery({
      examAttemptId: examId,
    });

    return data;
  }

  /// Returns null when license is not downloaded
  function newExam(categoryId: number) {
    const category = offlineStore.categories[categoryId];
    if (!category) {
      return null;
    }

    const questionCount = category.examQuestionCount;
    const startedAt = new Date(Date.now());
    const deadlineTime = new Date(Date.now() + 1000 * category.examTime);
    const attemptId = "offline-" + crypto.randomUUID();

    const attempt: ExamAttempt = {
      id: attemptId,
      userId: "self",
      categoryId,
      startedAt,
      deadlineTime,
      finishedAt: null,
    };
  }

  return { getExam, newExam };
}
