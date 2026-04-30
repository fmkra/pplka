"use client";

import type { GetExamResponse } from "~/server/api/routers/exam";
import { api } from "~/trpc/react";

export function useExam() {
  /// Returns exam data from server.
  /// Undefined - loading
  /// Null = doesn't exist
  function getExam(examId: string): GetExamResponse | undefined {
    const { data } = api.exam.getExam.useQuery({
      examAttemptId: examId,
    });

    return data;
  }

  /// Returns null when license is not downloaded
  function newExam(_categoryId: number) {
    // TODO: implement offline exams on top of IndexedDB
    return null;
  }

  return { getExam, newExam };
}
