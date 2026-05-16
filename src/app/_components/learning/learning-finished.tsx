import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

export function LearningFinished({
  licenseId,
  categoryId,
  isAnswerQuestionPending,
  onResetBegin: onLoadingBegin,
  onResetFinished: onLoaded,
}: {
  licenseId: number | null;
  categoryId: number;
  isAnswerQuestionPending: boolean;
  onResetBegin: () => void;
  onResetFinished: () => void;
}) {
  const utils = api.useUtils();
  const { mutate } = api.learning.resetLearningProgress.useMutation({
    onSuccess: async () => {
      if (licenseId !== null) {
        await utils.learning.getLicenseProgress.invalidate({ licenseId });
      }
      onLoaded();
    },
  });

  const [isRandom, setIsRandom] = useState(false);

  const startNewAttempt = () => {
    mutate({ categoryId, isRandom });
    onLoadingBegin();
  };

  // TODO: review questions

  // TODO: Button should not only be disabled, but show spinner

  return (
    <section className="mx-auto w-full max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Zakończyłeś naukę tego przedmiotu</CardTitle>
          <CardDescription>
            <div className="my-4 flex items-center justify-center gap-2">
              <Checkbox
                id="isRandom"
                checked={isRandom}
                onCheckedChange={() => setIsRandom(!isRandom)}
              />
              <Label htmlFor="isRandom">Losowa kolejność pytań</Label>
            </div>
            <Button
              disabled={isAnswerQuestionPending}
              onClick={startNewAttempt}
            >
              Zresetuj postęp i zacznij od nowa
            </Button>
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  );
}
