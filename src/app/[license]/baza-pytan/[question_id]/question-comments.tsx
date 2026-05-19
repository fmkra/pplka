"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import usePagination from "~/app/_components/pagination";
import { type SelectOption } from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";
import { UnconditionalLoginWarning } from "~/app/_components/login-warning";
import { TOS } from "~/app/links";

const pageSizeOptions: SelectOption[] = [
  { value: "5", label: "5 komentarzy" },
  { value: "10", label: "10 komentarzy" },
  { value: "20", label: "20 komentarzy" },
];

function formatCommentDate(date: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function QuestionComments({ questionId }: { questionId: string }) {
  const { data: session } = useSession();
  const isSessionLoading = session === undefined;
  const isLoggedIn = !!session?.user;

  const { data: totalCount, isLoading: countLoading } =
    api.questionComments.getCommentsCount.useQuery({ questionId });

  const pagination = usePagination(pageSizeOptions, "10", totalCount);

  const { data: comments, isLoading: commentsLoading } =
    api.questionComments.getComments.useQuery({
      questionId,
      limit: pagination.limit,
      offset: pagination.offset,
    });

  const setCurrentPage = pagination.setCurrentPage;
  useEffect(() => {
    setCurrentPage(1);
  }, [setCurrentPage, pagination.limit]);

  const isLoading = commentsLoading || countLoading;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-semibold">Komentarze</h2>

      {isSessionLoading || isLoggedIn ? (
        <AddCommentForm
          questionId={questionId}
          onCommentAdded={() => {
            pagination.setCurrentPage(1);
          }}
        />
      ) : (
        <UnconditionalLoginWarning
          header="aby dodać komentarz"
          description="Tylko zalogowani użytkownicy mogą publikować komentarze pod pytaniami."
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : !comments || comments.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Brak komentarzy. Bądź pierwszą osobą, która skomentuje to pytanie.
        </p>
      ) : (
        <>
          <p className="text-muted-foreground mb-4 text-sm">
            {totalCount === 1
              ? "1 komentarz"
              : totalCount != null && totalCount < 5
                ? `${totalCount} komentarze`
                : `${totalCount ?? 0} komentarzy`}
          </p>
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="bg-card rounded-lg border p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {comment.displayName ?? "Anonim"}
                  </span>
                  <time
                    dateTime={comment.createdAt.toISOString()}
                    className="text-muted-foreground text-xs"
                  >
                    {formatCommentDate(comment.createdAt)}
                  </time>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </li>
            ))}
          </ul>
          {(totalCount ?? 0) > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-y-4">
              <div className="ml-auto">{pagination.footer}</div>
              <div className="ml-auto flex items-center gap-2">
                <p className="text-sm">Na stronę: </p>
                <div className="w-40">{pagination.pageSizeSelector}</div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function AddCommentForm({
  questionId,
  onCommentAdded,
}: {
  questionId: string;
  onCommentAdded: () => void;
}) {
  const { data: session } = useSession();
  const defaultDisplayName = session?.user?.name ?? "";

  const [content, setContent] = useState("");
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [acceptTos, setAcceptTos] = useState(false);

  const utils = api.useUtils();

  useEffect(() => {
    if (session?.user?.name && displayName === "") {
      setDisplayName(session.user.name ?? "");
    }
  }, [session?.user?.name, displayName]);

  const createComment = api.questionComments.createComment.useMutation({
    onSuccess: async () => {
      setContent("");
      setDisplayName(defaultDisplayName);
      setIsAnonymous(false);
      setAcceptTos(false);
      onCommentAdded();
      await utils.questionComments.getComments.invalidate({ questionId });
      await utils.questionComments.getCommentsCount.invalidate({ questionId });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTos) return;

    const trimmedDisplayName = displayName.trim();
    createComment.mutate({
      questionId,
      content: content.trim(),
      displayName: isAnonymous
        ? null
        : trimmedDisplayName || defaultDisplayName || null,
      acceptTos: true,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 space-y-4 rounded-lg border p-4"
    >
      <div>
        <Label htmlFor="comment-content">Treść komentarza</Label>
        <textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
          maxLength={5000}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 mt-1.5 w-full min-w-0 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-none focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          placeholder="Napisz komentarz…"
        />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="comment-anonymous"
          checked={isAnonymous}
          onCheckedChange={(checked) => setIsAnonymous(checked === true)}
        />
        <Label
          htmlFor="comment-anonymous"
          className="text-muted-foreground leading-snug font-normal"
        >
          Komentuj anonimowo
        </Label>
      </div>
      {!isAnonymous && (
        <div>
          <Label htmlFor="comment-display-name">Wyświetlana nazwa</Label>
          <Input
            id="comment-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            className="mt-1.5"
            placeholder={defaultDisplayName}
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Możesz podać dowolną nazwę widoczną dla innych.
          </p>
        </div>
      )}
      <div className="flex items-start gap-2">
        <Checkbox
          id="comment-accept-tos"
          checked={acceptTos}
          onCheckedChange={(checked) => setAcceptTos(checked === true)}
        />
        <Label
          htmlFor="comment-accept-tos"
          className="text-muted-foreground inline leading-snug font-normal"
        >
          Akceptuję{" "}
          <Link
            href={`/${TOS}`}
            className="text-primary underline underline-offset-2 hover:no-underline"
            target="_blank"
          >
            regulamin serwisu
          </Link>
          , w tym, że mój komentarz może zostać wykorzystany do stworzenia
          Materiałów Edukacyjnych wydanych na Licencji CC BY-NC-ND.
        </Label>
      </div>
      {createComment.isError && (
        <p className="text-destructive text-sm">
          {createComment.error.message}
        </p>
      )}
      <Button
        type="submit"
        disabled={
          createComment.isPending || !acceptTos || content.trim().length === 0
        }
      >
        {createComment.isPending ? "Wysyłanie…" : "Dodaj komentarz"}
      </Button>
    </form>
  );
}
