"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import type { QuestionParsed } from "~/lib/shuffle";
import { useTimeLeft } from "~/lib/use-time-left";
import { api } from "~/trpc/react";
import { Clock } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { FlagTriangleRight } from "lucide-react";
import { useExamFlagsStore } from "~/stores";

export type Answer = "A" | "B" | "C" | "D" | null;

export type QuestionWithAnswer = QuestionParsed & {
  answer: Answer;
  questionInstanceId: string;
};

export function numberToAnswer(number: number) {
  if (number < 0 || number > 3) throw new Error("Invalid number");
  return String.fromCharCode(65 + number) as "A" | "B" | "C" | "D";
}

function getInitialAnswers(questions: QuestionWithAnswer[]) {
  const mapping = {} as Record<number, Answer>;
  questions.forEach((question, i) => {
    mapping[i] = question.answer;
  });
  return mapping;
}

function getInitialQuestion(questions: QuestionWithAnswer[]) {
  const index = questions.findIndex((question) => question.answer === null);
  if (index === -1) {
    return questions.length - 1;
  }
  return index;
}

export default function Exam({
  examAttemptId,
  questions,
  finishTime,
}: {
  examAttemptId: string;
  questions: QuestionWithAnswer[];
  finishTime: number;
}) {
  const [warningMessage, setWarningMessage] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(() =>
    getInitialQuestion(questions),
  );
  const [selectedAnswers, setSelectedAnswers] = useState(() =>
    getInitialAnswers(questions),
  );

  // It is rendered only client side, so there will be no hydration error
  const timeLeft = useTimeLeft(finishTime, Date.now(), () => sendAnswer(true));

  const utils = api.useUtils();
  const { mutate } = api.exam.answerQuestion.useMutation({
    onSuccess: () => {
      void utils.exam.getExams.invalidate();
    },
  });

  const setAnswers = (
    questionInstanceId: string,
    answer: Answer,
    isFinished: boolean,
  ) => {
    utils.exam.getExam.setData({ examAttemptId }, (old) => {
      if (!old) return old;
      return [
        isFinished ? { ...old[0], finishedAt: new Date() } : old[0],
        old[1].map((q) =>
          q.questionInstanceId === questionInstanceId ? { ...q, answer } : q,
        ),
      ];
    });
  };

  const sendAnswer = (finishExam = false) => {
    if (
      !questions[currentQuestion] ||
      selectedAnswers[currentQuestion] === undefined
    )
      return;

    const hasAnswerChanged =
      selectedAnswers[currentQuestion] !== questions[currentQuestion]?.answer;
    if (hasAnswerChanged || finishExam) {
      mutate({
        examAttemptId,
        question: hasAnswerChanged
          ? {
              questionInstanceId: questions[currentQuestion].questionInstanceId,
              answer: selectedAnswers[currentQuestion],
            }
          : undefined,
        finishExam,
      });
      setAnswers(
        questions[currentQuestion].questionInstanceId,
        selectedAnswers[currentQuestion],
        finishExam,
      );
    }
  };

  const handleAnswerSelect = (questionIndex: number, answer: Answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      sendAnswer();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      sendAnswer();
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const selectQuestion = (index: number) => {
    sendAnswer();
    setCurrentQuestion(index);
  };

  const handleSubmit = () => {
    sendAnswer(true);
    setWarningMessage(false);
  };

  const { flags, setFlag } = useExamFlagsStore().attempt(examAttemptId);

  const currentQ = questions[currentQuestion]!;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const questionInstanceId = questions[currentQuestion]!.questionInstanceId;
  const hasFlag = flags[questionInstanceId] ?? false;
  const toggleFlag = () => {
    setFlag(questionInstanceId, !hasFlag);
  };

  return (
    <>
      {warningMessage && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/70">
          <Card>
            <CardContent>
              <div className="flex flex-col gap-2">
                <p>Czy na pewno chcesz zakończyć egzamin?</p>
                <div className="flex justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setWarningMessage(false)}
                  >
                    Wróć do egzaminu
                  </Button>
                  <Button onClick={handleSubmit}>Zakończ egzamin</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-4">
          <div className="mr-auto">
            <h1 className="text-2xl font-bold">Egzamin</h1>
            <p className="text-muted-foreground">
              Pytanie {currentQuestion + 1} z {questions.length}
            </p>
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {timeLeft === undefined ? (
              <Skeleton className="h-4 w-12" />
            ) : (
              <span
                className={cn(
                  "text-right font-mono",
                  timeLeft === null && "text-red-500",
                )}
              >
                {timeLeft ?? "Czas upłynął"}
              </span>
            )}
          </div>
          <Button onClick={() => setWarningMessage(true)}>
            Zakończ egzamin
          </Button>
        </div>

        <Progress value={progress} className="mt-2 mb-6" />

        <Card>
          <CardHeader>
            <CardTitle className="flex text-xl">
              <span className="w-full">{currentQ.question}</span>
              <button
                className="h-6 shrink-0 cursor-pointer px-2"
                onClick={toggleFlag}
              >
                <FlagTriangleRight
                  className={cn("size-5", hasFlag && "text-red-500")}
                />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedAnswers[currentQuestion]}
              onValueChange={(value) =>
                handleAnswerSelect(currentQuestion, value as Answer)
              }
              className="space-y-3"
            >
              {currentQ.answers.map(([dbIndex, answer], index) => (
                <div
                  key={index}
                  className="hover:bg-accent flex cursor-pointer items-center space-x-3 rounded-lg border p-4"
                  onClick={() =>
                    handleAnswerSelect(currentQuestion, numberToAnswer(dbIndex))
                  }
                >
                  <RadioGroupItem
                    value={numberToAnswer(dbIndex)}
                    id={`answer-${index}`}
                  />
                  <Label
                    htmlFor={`answer-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="mr-2 font-medium">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {answer}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="mt-6 mb-3 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Poprzednie pytanie
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentQuestion === questions.length - 1}
          >
            Następne pytanie
          </Button>
        </div>

        <div className="bg-muted mt-6 rounded-lg p-4">
          <h3 className="mb-2 font-medium">Pytania</h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => (
              <button
                className="relative cursor-pointer"
                key={index}
                onClick={() => selectQuestion(index)}
              >
                {flags[q.questionInstanceId] && (
                  <div className="absolute top-0 right-0 z-10 border-6 border-t-red-500 border-r-red-500 border-b-transparent border-l-transparent"></div>
                )}
                <Badge
                  variant={
                    index === currentQuestion
                      ? "default"
                      : selectedAnswers[index] !== null
                        ? "outline"
                        : "black-outline"
                  }
                  className="block"
                >
                  {index + 1}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
