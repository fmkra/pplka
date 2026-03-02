import { api } from "~/trpc/react";
import MdRender from "./md-render";
import { Spinner } from "~/components/ui/spinner";

export function Explanation({
  questionId,
  enabled,
}: {
  questionId: string;
  enabled: boolean;
}) {
  const { data, isLoading } = api.explanation.getExplanations.useQuery(
    { questionId: questionId },
    { enabled },
  );

  if (isLoading)
    return (
      <div className="mt-4 flex w-full justify-center">
        <Spinner />
      </div>
    );
  if (data && data.length > 0)
    return data.map(({ explanation: e }) => (
      <MdRender key={e.id}>{e.explanation}</MdRender>
    ));
  return <p className="text-muted-foreground text-sm">Brak wyjaśnień</p>;
}
