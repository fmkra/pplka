"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { numberToAnswer, type QuestionWithAnswer } from "./exam";
import { cn, PASS_THRESHOLD } from "~/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  CheckCircle,
  CircleQuestionMark,
  FlagTriangleRight,
  XCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import CategoryStartButton from "../category-start-button";
import { useExamFlagsStore } from "~/stores";
import type { FinishedExamAttempt } from "~/lib/types";

export default function ExamSummary({
  attempt,
  questions,
  categoryId,
}: {
  attempt: FinishedExamAttempt;
  questions: QuestionWithAnswer[];
  categoryId: number;
}) {
  const { flags } = useExamFlagsStore().attempt(attempt.id);

  const calculateScore = () => {
    let correct = 0;
    for (const question of questions) {
      if (question.answer === "A") {
        correct++;
      }
    }
    return correct;
  };

  const score = calculateScore();
  const percentage = (score / questions.length) * 100;
  const isPassed = score >= questions.length * PASS_THRESHOLD;
  const duration =
    Math.min(attempt.finishedAt.getTime(), attempt.deadlineTime.getTime()) -
    attempt.startedAt.getTime();
  const durationSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(durationSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (durationSeconds % 60).toString().padStart(2, "0");

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle
          className={cn(
            "text-2xl",
            isPassed ? "text-green-500" : "text-red-500",
          )}
        >
          {isPassed ? "Zaliczony" : "Niezaliczony"}
        </CardTitle>
        <CardDescription>
          Czas trwania: {minutes}:{seconds}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          <div className="mb-2 text-4xl font-bold">
            {percentage.toFixed(0)}%
          </div>
          <div className="text-muted-foreground">
            {score} z {questions.length} odpowiedzi poprawnych
          </div>
        </div>

        <Accordion type="single" collapsible>
          {questions.map((question, index) => (
            <AccordionItem key={question.id} value={question.id}>
              <AccordionTrigger iconSide="left">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Pytanie {index + 1}</span>
                    {flags[question.questionInstanceId] && (
                      <FlagTriangleRight className="size-4" />
                    )}
                  </div>
                  <div>
                    {question.answer === "A" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : question.answer === null ? (
                      <CircleQuestionMark className="h-5 w-5 text-slate-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-left">
                <p className="mb-4">{question.question}</p>
                <div className="flex flex-col gap-3">
                  {question.answers.map(([dbIndex, answer]) => (
                    <div
                      key={dbIndex}
                      className={cn(
                        "rounded-lg border px-4 py-3",
                        question.answer === numberToAnswer(dbIndex) &&
                          "border-red-500",
                        dbIndex === 0 && "border-green-500",
                      )}
                    >
                      {answer}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex justify-center gap-4">
          <Button variant="outline" asChild>
            <Link href=".">Wróć do egzaminów</Link>
          </Button>
          <CategoryStartButton
            categoryId={categoryId}
            className="w-34"
            replaceLink
          >
            Rozpocznij nowy
          </CategoryStartButton>
        </div>
      </CardContent>
    </Card>
  );
}
