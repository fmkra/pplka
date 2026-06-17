"use client";

import Link from "next/link";
import usePagination from "~/app/_components/pagination";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { type SelectOption } from "~/components/ui/select";
import { api } from "~/trpc/react";

const pageSizeOptions: SelectOption[] = [
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
];

function shorten(value: string, max = 120) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminCommentsPage() {
  const { data: totalCount } = api.admin.getCommentsCount.useQuery();
  const pagination = usePagination(pageSizeOptions, "20", totalCount);
  const { data: comments, isLoading } = api.admin.getLatestComments.useQuery({
    limit: pagination.limit,
    offset: pagination.offset,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Najnowsze komentarze</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : !comments || comments.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            Brak komentarzy.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Data</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Użytkownik
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Komentarz
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Pytanie</th>
                    <th className="w-40 px-4 py-3 text-left font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-muted/50 border-b">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(comment.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {comment.displayName ??
                          comment.userName ??
                          comment.userEmail ??
                          "Anonimowy"}
                      </td>
                      <td className="px-4 py-3">{shorten(comment.content)}</td>
                      <td className="px-4 py-3">
                        {shorten(comment.question, 90)}
                      </td>
                      <td className="px-4 py-3">
                        {comment.targetUrl ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={comment.targetUrl}>
                              Przejdź do pytania
                            </Link>
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-y-4">
              <span className="text-muted-foreground text-sm">
                Pokazano {totalCount ? pagination.currentPageRange : "0-0"} z{" "}
                {totalCount ?? 0}
              </span>
              <div className="ml-auto">{pagination.footer}</div>
              <div className="ml-auto flex items-center gap-2">
                <p className="text-sm">Ilość na stronę:</p>
                <div className="w-24">{pagination.pageSizeSelector}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
