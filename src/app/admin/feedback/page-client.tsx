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

function shorten(value: string | null, max = 110) {
  if (!value) return "-";
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

function TableFooter({
  pagination,
  total,
}: {
  pagination: ReturnType<typeof usePagination>;
  total: number | undefined;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-y-4">
      <span className="text-muted-foreground text-sm">
        Pokazano {total ? pagination.currentPageRange : "0-0"} z {total ?? 0}
      </span>
      <div className="ml-auto">{pagination.footer}</div>
      <div className="ml-auto flex items-center gap-2">
        <p className="text-sm">Ilość na stronę:</p>
        <div className="w-24">{pagination.pageSizeSelector}</div>
      </div>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const { data: feedbackCount } = api.admin.getFeedbackCount.useQuery();
  const latestPagination = usePagination(pageSizeOptions, "20", feedbackCount);
  const { data: latestFeedback, isLoading: latestLoading } =
    api.admin.getLatestFeedback.useQuery({
      limit: latestPagination.limit,
      offset: latestPagination.offset,
    });

  const { data: questionSummaryCount } =
    api.admin.getQuestionFeedbackSummaryCount.useQuery();
  const questionPagination = usePagination(
    pageSizeOptions,
    "20",
    questionSummaryCount,
  );
  const { data: questionSummary, isLoading: questionSummaryLoading } =
    api.admin.getQuestionFeedbackSummary.useQuery({
      limit: questionPagination.limit,
      offset: questionPagination.offset,
    });

  const { data: kbSummaryCount } =
    api.admin.getKnowledgeBaseFeedbackSummaryCount.useQuery();
  const kbPagination = usePagination(pageSizeOptions, "20", kbSummaryCount);
  const { data: kbSummary, isLoading: kbSummaryLoading } =
    api.admin.getKnowledgeBaseFeedbackSummary.useQuery({
      limit: kbPagination.limit,
      offset: kbPagination.offset,
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Najnowszy feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {latestLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !latestFeedback || latestFeedback.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Brak feedbacku.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">Data</th>
                      <th className="px-4 py-3 text-left font-medium">Typ</th>
                      <th className="px-4 py-3 text-left font-medium">Ocena</th>
                      <th className="px-4 py-3 text-left font-medium">Treść</th>
                      <th className="px-4 py-3 text-left font-medium">Uwagi</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Użytkownik
                      </th>
                      <th className="w-40 px-4 py-3 text-left font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestFeedback.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/50 border-b">
                        <td className="px-4 py-3 text-sm">
                          {formatDate(row.submittedAt)}
                        </td>
                        <td className="px-4 py-3">
                          {row.questionId ? "Pytanie" : "Artykuł"}
                        </td>
                        <td className="px-4 py-3">{row.rating}/5</td>
                        <td className="px-4 py-3">
                          {shorten(row.question ?? row.knowledgeBaseNodeName)}
                        </td>
                        <td className="px-4 py-3">
                          {shorten(row.details, 80)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {row.userName ?? row.userEmail ?? "Anonimowy"}
                        </td>
                        <td className="px-4 py-3">
                          {row.targetUrl ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={row.targetUrl}>
                                Przejdź do treści
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Brak linku
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TableFooter
                pagination={latestPagination}
                total={feedbackCount}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie pytań</CardTitle>
        </CardHeader>
        <CardContent>
          {questionSummaryLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !questionSummary || questionSummary.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Brak ocen pytań.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">
                        Pytanie
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Oceny</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Średnia
                      </th>
                      <th className="w-40 px-4 py-3 text-left font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionSummary.map((row) => (
                      <tr
                        key={row.questionId}
                        className="hover:bg-muted/50 border-b"
                      >
                        <td className="px-4 py-3">{shorten(row.question)}</td>
                        <td className="px-4 py-3">{row.ratings}</td>
                        <td className="px-4 py-3">
                          {row.averageRating.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {row.targetUrl ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={row.targetUrl}>
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
              <TableFooter
                pagination={questionPagination}
                total={questionSummaryCount}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie bazy wiedzy</CardTitle>
        </CardHeader>
        <CardContent>
          {kbSummaryLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !kbSummary || kbSummary.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Brak ocen artykułów.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">
                        Artykuł
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Oceny</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Średnia
                      </th>
                      <th className="w-40 px-4 py-3 text-left font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {kbSummary.map((row) => (
                      <tr
                        key={row.knowledgeBaseNodeId}
                        className="hover:bg-muted/50 border-b"
                      >
                        <td className="px-4 py-3">{shorten(row.name)}</td>
                        <td className="px-4 py-3">{row.ratings}</td>
                        <td className="px-4 py-3">
                          {row.averageRating.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {row.targetUrl ? (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={row.targetUrl}>
                                Przejdź do artykułu
                              </Link>
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TableFooter pagination={kbPagination} total={kbSummaryCount} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
