"use client";

import { notFound, useParams } from "next/navigation";
import { getRandomNumber, shuffleAnswers } from "~/lib/shuffle";
import Exam from "./exam";
import ExamSummary from "./summary";
import { Spinner } from "~/components/ui/spinner";
import { useExam } from "~/offline/exam";

export default function ExamAttempt({ examId }: { examId?: string }) {
  const { exam_id } = useParams<{ exam_id?: string }>();
  const resolvedExamId = examId ?? exam_id ?? "";
  const { data } = useExam(resolvedExamId);

  if (data === null) notFound();

  if (!data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const { attempt, questions, source, licenseUrl } = data;

  const questionsParsed = questions.map((examQuestion) => ({
    ...shuffleAnswers(
      examQuestion,
      getRandomNumber(`${attempt.id}_${examQuestion.questionInstanceId}`),
    ),
    answer: examQuestion.answer,
    questionInstanceId: examQuestion.questionInstanceId,
    hasExplanation: examQuestion.hasExplanation,
  }));

  if (attempt.finishedAt === null)
    return (
      <Exam
        examAttemptId={attempt.id}
        questions={questionsParsed}
        finishTime={attempt.deadlineTime.getTime()}
        isOffline={source === "offline"}
      />
    );

  return (
    <ExamSummary
      attempt={{ ...attempt, finishedAt: attempt.finishedAt }}
      questions={questionsParsed}
      categoryId={attempt.categoryId}
      isOffline={source === "offline"}
      licenseUrl={licenseUrl}
    />
  );
}
