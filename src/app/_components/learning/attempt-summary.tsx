import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import type { ExtendedAttempt } from "~/app/[license]/nauka/[category]/category-learning-client";
import { api } from "~/trpc/react";
import { conjugate } from "~/lib/utils";

export function LearningAttemptSummary({
  attempt,
  categoryId,
  isAnswerQuestionPending,
  nextAttempt,
}: {
  attempt: ExtendedAttempt;
  categoryId: number;
  nextAttempt: () => void;
  // Whether mutation that sends question answers is still in progress.
  // In that case, user shouldn't be able to take any action.
  isAnswerQuestionPending: boolean;
}) {
  const { mutate } = api.learning.nextAttempt.useMutation({
    onSuccess: () => {
      nextAttempt();
    },
  });

  const startNextAttempt = () => {
    mutate({ categoryId });
  };

  // TODO: Button should not only be disabled, but show spinner

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-center">Podsumowanie podejścia</CardTitle>
        <CardDescription>
          {generateSummaryContent(attempt).map((content, index) => (
            <p key={index}>{content}</p>
          ))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button disabled={isAnswerQuestionPending} onClick={startNextAttempt}>
          Rozpocznij kolejne podejście
        </Button>
      </CardContent>
    </Card>
  );
}

function generateSummaryContent(attempt: ExtendedAttempt) {
  return [
    ...(attempt.currentAttempt == 1
      ? [
          `To było Twoje pierwsze podejście i odpowiedziałeś poprawnie na ${attempt.answeredCorrectly} ${conjugate(attempt.answeredCorrectly, "pytanie", "pytania", "pytań")}.`,
        ]
      : [
          `W poprzednich podejściach odpowiedziałeś poprawnie na ${attempt.previouslyAnswered} ${conjugate(attempt.previouslyAnswered, "pytanie", "pytania", "pytań")}.`,
          `W tym podejściu odpowiedziałeś poprawnie na ${attempt.answeredCorrectly} ${conjugate(attempt.answeredCorrectly, "nowe pytanie", "nowe pytania", "nowych pytań")}.`,
        ]),

    `${conjugate(attempt.answeredIncorrectly, "Pozostało", "Pozostały", "Pozostało")} ci ${attempt.answeredIncorrectly} ${conjugate(attempt.answeredIncorrectly, "pytanie", "pytania", "pytań")} do nauki.`,
  ];
}
