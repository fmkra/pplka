"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type Props =
  | { variant: "explanation"; questionId: string }
  | { variant: "material"; knowledgeBaseNodeId: string };

const labelByVariant = {
  explanation: "Jak bardzo to wyjaśnienie było pomocne?",
  material: "Jak bardzo ten materiał był pomocny?",
} as const;

export function HelpfulnessFeedback(props: Props) {
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [phase, setPhase] = useState<"rating" | "details" | "done">("rating");

  const submitRating = api.contentFeedback.submitRating.useMutation({
    onSuccess: (data) => {
      setFeedbackId(data.id);
      setPhase("details");
    },
  });

  const submitDetails = api.contentFeedback.submitDetails.useMutation({
    onSuccess: () => {
      setPhase("done");
    },
  });

  const target =
    props.variant === "explanation"
      ? { questionId: props.questionId }
      : { knowledgeBaseNodeId: props.knowledgeBaseNodeId };

  if (phase === "done") {
    return (
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Dziękujemy za opinię.
      </p>
    );
  }

  return (
    <div className="not-prose mt-6 flex flex-col items-center border-t pt-4">
      <p className="text-foreground mb-3 text-sm font-medium">
        {labelByVariant[props.variant]}
      </p>

      {phase === "rating" && (
        <div className="flex flex-wrap items-center gap-2">
          {submitRating.isError && (
            <p className="text-destructive w-full text-sm">
              {submitRating.error.message}
            </p>
          )}
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={submitRating.isPending}
              onClick={() => submitRating.mutate({ ...target, rating: n })}
              className={cn(
                "ring-offset-background focus-visible:ring-ring bg-background flex h-10 min-w-10 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground hover:cursor-pointer",
                "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
              aria-label={`Ocena ${n} z 5`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {phase === "details" && feedbackId != null && (
        <>
          {submitDetails.isError && (
            <p className="text-destructive text-sm">
              {submitDetails.error.message}
            </p>
          )}
          <label className="mr-auto block" htmlFor="feedback-details">
            <span className="text-muted-foreground mb-1.5 block text-sm">
              Chcesz dopisać coś więcej? (opcjonalnie)
            </span>
          </label>
          <textarea
            id="feedback-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-0 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-none focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            placeholder="Np. co było niejasne albo co pomogło…"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={submitDetails.isPending}
              onClick={() => submitDetails.mutate({ id: feedbackId, details })}
            >
              Wyślij
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={submitDetails.isPending}
              onClick={() => setPhase("done")}
            >
              Pomiń
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
