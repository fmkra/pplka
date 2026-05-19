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
    <section className="mx-auto w-full max-w-xl text-center">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl">Podsumowanie postępu nauki</h1>
          </CardTitle>
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
    </section>
  );
}

function generateSummaryContent(attempt: ExtendedAttempt) {
  const totalAnsweredCorrectly =
    attempt.answeredCorrectly + attempt.previouslyAnswered;
  return [
    ...(attempt.currentAttempt == 1
      ? [
          "To było Twoje pierwsze podejście.",
          `Do tej pory odpowiedziałeś poprawnie na ${attempt.answeredCorrectly} ${conjugate(attempt.answeredCorrectly, "pytanie", "pytania", "pytań")}.`,
        ]
      : [
          `Opanowałeś już ${totalAnsweredCorrectly} ${conjugate(totalAnsweredCorrectly, "pytanie", "pytania", "pytań")}, z czego w ostatnim podejściu ${attempt.answeredCorrectly}.`,
        ]),

    `Do nauczenia ${conjugate(attempt.answeredIncorrectly, "pozostało", "pozostały", "pozostało")} ci ${attempt.answeredIncorrectly} ${conjugate(attempt.answeredIncorrectly, "pytanie", "pytania", "pytań")}.`,
  ];
}
