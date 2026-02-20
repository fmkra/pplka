"use client";

import { notFound, useParams } from "next/navigation";
import { getRandomNumber, shuffleAnswers } from "~/lib/shuffle";
import Exam from "./exam";
import ExamSummary from "./summary";
import { Spinner } from "~/components/ui/spinner";
import type { FinishedExamAttempt } from "~/lib/types";
import { useExam } from "~/offline/exam";

export default function ExamAttempt() {
  const { exam_id } = useParams<{ exam_id: string }>();
  const { getExam } = useExam();

  const data = getExam(exam_id);

  if (data === null) notFound();

  if (!data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const [attempt, questions] = data;

  const questionsParsed = questions.map((examQuestion) => ({
    ...shuffleAnswers(
      examQuestion.questionInstance.question,
      getRandomNumber(`${attempt.id}_${examQuestion.questionInstanceId}`),
    ),
    answer: examQuestion.answer,
    questionInstanceId: examQuestion.questionInstance.id,
  }));

  if (attempt.finishedAt === null)
    return (
      <Exam
        examAttemptId={attempt.id}
        questions={questionsParsed}
        finishTime={attempt.deadlineTime.getTime()}
      />
    );

  return (
    <ExamSummary
      attempt={attempt as FinishedExamAttempt}
      questions={questionsParsed}
      categoryId={attempt.categoryId}
    />
  );
}
