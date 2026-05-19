"use client";

import { CircleQuestionMarkIcon } from "lucide-react";
import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn, conjugate } from "~/lib/utils";

interface LearningProgressBarProps {
  attempt: {
    previouslyAnswered: number;
    answeredCorrectly: number;
    answeredIncorrectly: number;
    notAnswered: number;
    currentAttempt: number;
  };
  className?: string;
  height?: string;
}

export function LearningProgressBar({
  attempt,
  className,
  height = "h-3",
}: LearningProgressBarProps) {
  const total =
    attempt.previouslyAnswered +
    attempt.answeredCorrectly +
    attempt.answeredIncorrectly +
    attempt.notAnswered;

  if (total === 0) {
    return (
      <div
        className={cn("w-full rounded-full bg-gray-200", height, className)}
      />
    );
  }

  const previouslyAnsweredPercent = (attempt.previouslyAnswered / total) * 100;
  const answeredCorrectlyPercent = (attempt.answeredCorrectly / total) * 100;
  const answeredIncorrectlyPercent =
    (attempt.answeredIncorrectly / total) * 100;
  const notAnsweredPercent = (attempt.notAnswered / total) * 100;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-full",
          height,
          className,
        )}
      >
        {attempt.previouslyAnswered > 0 && (
          <div
            className="bg-green-800"
            style={{ width: `${previouslyAnsweredPercent}%` }}
            title={`Poprawne z poprzednich podejść: ${attempt.previouslyAnswered}`}
          />
        )}

        {attempt.answeredCorrectly > 0 && (
          <div
            className="bg-green-400"
            style={{ width: `${answeredCorrectlyPercent}%` }}
            title={`Poprawne w tym podejściu: ${attempt.answeredCorrectly}`}
          />
        )}

        {attempt.answeredIncorrectly > 0 && (
          <div
            className="bg-red-500"
            style={{ width: `${answeredIncorrectlyPercent}%` }}
            title={`Niepoprawne w tym podejściu: ${attempt.answeredIncorrectly}`}
          />
        )}

        {attempt.notAnswered > 0 && (
          <div
            className="bg-gray-200"
            style={{ width: `${notAnsweredPercent}%` }}
            title={`Pozostało: ${attempt.notAnswered}`}
          />
        )}
      </div>
      <Tooltip>
        <TooltipTrigger>
          <CircleQuestionMarkIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent>
          {generateTooltipContent(attempt).map((content, index) => (
            <p key={index}>{content}</p>
          ))}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function generateTooltipContent(attempt: LearningProgressBarProps["attempt"]) {
  if (attempt.currentAttempt == 1)
    return [
      "To jest twoje pierwsze podejście.",
      `Odpowiedziałeś poprawnie na ${attempt.answeredCorrectly} ${conjugate(attempt.answeredCorrectly, "pytanie, dlatego nie zobaczysz go", "pytania, dlatego nie zobaczysz ich", "pytań, dlatego nie zobaczysz ich")} w kolejnym podejściu.`,
      `Na ${attempt.answeredIncorrectly} ${conjugate(attempt.answeredIncorrectly, "pytanie", "pytania", "pytań")} odpowiedziałeś niepoprawnie.`,
      `Do zakończenia podejścia pozostało ci ${attempt.notAnswered} ${conjugate(attempt.notAnswered, "pytanie", "pytania", "pytań")}.`,
    ];
  return [
    `W poprzednich podejściach odpowiedziałeś poprawnie na ${attempt.previouslyAnswered} ${conjugate(attempt.previouslyAnswered, "pytanie", "pytania", "pytań")}.`,
    `W tym podejściu udzieliłeś ${attempt.answeredCorrectly} ${conjugate(attempt.answeredCorrectly, "poprawną odpowiedź", "poprawne odpowiedzi", "poprawnych odpowiedzi")}, a na ${attempt.answeredIncorrectly} ${conjugate(attempt.answeredIncorrectly, "pytanie", "pytania", "pytań")} odpowiedziałeś niepoprawnie.`,
    `Do zakończenia podejścia pozostało ci ${attempt.notAnswered} ${conjugate(attempt.notAnswered, "pytanie", "pytania", "pytań")}.`,
  ];
}
