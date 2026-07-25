"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  X,
} from "lucide-react";
import usePagination from "~/app/_components/pagination";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, type SelectOption } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const pageSizeOptions: SelectOption[] = [
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
];
const sourceOptions: SelectOption[] = [
  { label: "Wszyscy", value: "all" },
  { label: "Zalogowani", value: "authenticated" },
  { label: "Anonimowi", value: "anonymous" },
];
const detailsOptions: SelectOption[] = [
  { label: "Wszystkie", value: "all" },
  { label: "Z uzasadnieniem", value: "with" },
  { label: "Bez uzasadnienia", value: "without" },
];

type SourceFilter = "all" | "authenticated" | "anonymous";
type DetailsFilter = "all" | "with" | "without";
type HistogramTarget = "question" | "article";
type ModalTarget = { target: HistogramTarget; id: string; title: string };
type KnowledgeBaseNode = {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  order: number;
};

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

function Histogram({ data }: { data: { rating: number; count: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center">
        Brak ocen spełniających wybrane filtry.
      </p>
    );
  }
  return (
    <div className="h-72 w-full" aria-label="Histogram ocen od 1 do 5">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="rating"
            label={{ value: "Ocena", position: "insideBottom", offset: -2 }}
          />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value) => [Number(value), "Liczba ocen"]} />
          <Bar
            dataKey="count"
            name="Liczba ocen"
            fill="var(--chart-1)"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HistogramPanel({
  target,
  source,
  details,
  categoryName,
  folderId,
}: {
  target: HistogramTarget;
  source: SourceFilter;
  details: DetailsFilter;
  categoryName: string | null;
  folderId: string | null;
}) {
  const { data, isLoading } = api.admin.getFeedbackHistogram.useQuery({
    target,
    source,
    details,
    categoryName,
    folderId,
  });
  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="mb-2 font-medium">Rozkład wszystkich widocznych ocen</h3>
      {isLoading || !data ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <Histogram data={data} />
      )}
    </div>
  );
}

function HistogramModal({
  item,
  onClose,
  source,
  details,
}: {
  item: ModalTarget | null;
  onClose: () => void;
  source: SourceFilter;
  details: DetailsFilter;
}) {
  const { data, isLoading } = api.admin.getFeedbackHistogram.useQuery(
    {
      target: item?.target ?? "question",
      targetId: item?.id,
      source,
      details,
      categoryName: null,
      folderId: null,
    },
    { enabled: item != null },
  );
  useEffect(() => {
    if (!item) return;
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [item, onClose]);
  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="histogram-title"
        className="bg-card w-full max-w-2xl rounded-xl border p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 id="histogram-title" className="text-lg font-semibold">
              Rozkład ocen
            </h2>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {item.title}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Zamknij"
          >
            <X />
          </Button>
        </div>
        {isLoading || !data ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <Histogram data={data} />
        )}
      </div>
    </div>
  );
}

function FeedbackFilters({
  source,
  details,
  onSourceChange,
  onDetailsChange,
}: {
  source: SourceFilter;
  details: DetailsFilter;
  onSourceChange: (value: SourceFilter) => void;
  onDetailsChange: (value: DetailsFilter) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtry feedbacku</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Autor oceny</span>
          <Select
            options={sourceOptions}
            value={source}
            onValueChange={(value) => onSourceChange(value as SourceFilter)}
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Uzasadnienie</span>
          <Select
            options={detailsOptions}
            value={details}
            onValueChange={(value) => onDetailsChange(value as DetailsFilter)}
          />
        </label>
      </CardContent>
    </Card>
  );
}

function KnowledgeBaseTree({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: KnowledgeBaseNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const children = useMemo(() => {
    const result = new Map<string, KnowledgeBaseNode[]>();
    for (const node of nodes) {
      const key = node.parentId ?? "root";
      result.set(key, [...(result.get(key) ?? []), node]);
    }
    return result;
  }, [nodes]);
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const renderNodes = (parentId: string | null, depth = 0) =>
    (children.get(parentId ?? "root") ?? []).map((node) => {
      const isFolder = node.type === "folder";
      const isOpen = expanded.has(node.id);
      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-1"
            style={{ paddingLeft: depth * 18 }}
          >
            {isFolder ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => toggle(node.id)}
                aria-label={isOpen ? "Zwiń folder" : "Rozwiń folder"}
              >
                {isOpen ? <ChevronDown /> : <ChevronRight />}
              </Button>
            ) : (
              <span className="w-7" />
            )}
            <button
              type="button"
              disabled={!isFolder}
              onClick={() =>
                isFolder && onSelect(selectedId === node.id ? null : node.id)
              }
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                isFolder && "hover:bg-accent",
                selectedId === node.id &&
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                !isFolder && "text-muted-foreground",
              )}
            >
              {isFolder ? (
                <Folder className="size-4 shrink-0" />
              ) : (
                <FileText className="size-4 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </button>
          </div>
          {isFolder && isOpen ? renderNodes(node.id, depth + 1) : null}
        </div>
      );
    });
  return (
    <div className="rounded-md border p-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "hover:bg-accent mb-1 w-full rounded-md px-2 py-1.5 text-left text-sm",
          selectedId == null &&
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
        )}
      >
        Wszystkie artykuły
      </button>
      <div className="max-h-72 overflow-y-auto">{renderNodes(null)}</div>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [source, setSource] = useState<SourceFilter>("all");
  const [details, setDetails] = useState<DetailsFilter>("all");
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null);
  const { data: filterOptions } = api.admin.getFeedbackFilterOptions.useQuery();

  const { data: feedbackCount } = api.admin.getFeedbackCount.useQuery({
    source,
    details,
  });
  const latestPagination = usePagination(pageSizeOptions, "20", feedbackCount);
  const setLatestPage = latestPagination.setCurrentPage;
  const { data: latestFeedback, isLoading: latestLoading } =
    api.admin.getLatestFeedback.useQuery({
      source,
      details,
      limit: latestPagination.limit,
      offset: latestPagination.offset,
    });

  const questionFilters = { source, details, categoryName };
  const { data: questionSummaryCount } =
    api.admin.getQuestionFeedbackSummaryCount.useQuery(questionFilters);
  const questionPagination = usePagination(
    pageSizeOptions,
    "20",
    questionSummaryCount,
  );
  const setQuestionPage = questionPagination.setCurrentPage;
  const { data: questionSummary, isLoading: questionSummaryLoading } =
    api.admin.getQuestionFeedbackSummary.useQuery({
      ...questionFilters,
      limit: questionPagination.limit,
      offset: questionPagination.offset,
    });

  const articleFilters = { source, details, folderId };
  const { data: kbSummaryCount } =
    api.admin.getKnowledgeBaseFeedbackSummaryCount.useQuery(articleFilters);
  const kbPagination = usePagination(pageSizeOptions, "20", kbSummaryCount);
  const setKbPage = kbPagination.setCurrentPage;
  const { data: kbSummary, isLoading: kbSummaryLoading } =
    api.admin.getKnowledgeBaseFeedbackSummary.useQuery({
      ...articleFilters,
      limit: kbPagination.limit,
      offset: kbPagination.offset,
    });

  useEffect(() => setLatestPage(1), [source, details, setLatestPage]);
  useEffect(
    () => setQuestionPage(1),
    [source, details, categoryName, setQuestionPage],
  );
  useEffect(() => setKbPage(1), [source, details, folderId, setKbPage]);

  const categoryOptions: SelectOption[] = [
    { label: "Wszystkie kategorie", value: "all" },
    ...(filterOptions?.categories.map((category) => ({
      value: category.name,
      label: category.name,
    })) ?? []),
  ];

  return (
    <div className="space-y-6">
      <FeedbackFilters
        source={source}
        details={details}
        onSourceChange={setSource}
        onDetailsChange={setDetails}
      />

      <Card>
        <CardHeader>
          <CardTitle>Najnowszy feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {latestLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !latestFeedback?.length ? (
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
                      <th className="w-40 px-4 py-3" />
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
          <div className="mb-6 max-w-md space-y-2">
            <span className="text-sm font-medium">Kategoria</span>
            <Select
              options={categoryOptions}
              value={categoryName ?? "all"}
              onValueChange={(value) =>
                setCategoryName(value === "all" ? null : value)
              }
            />
          </div>
          {questionSummaryLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !questionSummary?.length ? (
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
                      <th className="w-56 px-4 py-3" />
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
                          <div className="flex justify-end gap-2">
                            {row.targetUrl ? (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={row.targetUrl}>Przejdź</Link>
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8"
                              aria-label="Pokaż histogram ocen"
                              onClick={() =>
                                row.questionId &&
                                setModalTarget({
                                  target: "question",
                                  id: row.questionId,
                                  title: row.question ?? "Pytanie",
                                })
                              }
                            >
                              <BarChart3 />
                            </Button>
                          </div>
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
          <HistogramPanel
            target="question"
            source={source}
            details={details}
            categoryName={categoryName}
            folderId={null}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie bazy wiedzy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-2">
            <span className="text-sm font-medium">Folder w bazie wiedzy</span>
            <KnowledgeBaseTree
              nodes={filterOptions?.knowledgeBaseNodes ?? []}
              selectedId={folderId}
              onSelect={setFolderId}
            />
          </div>
          {kbSummaryLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !kbSummary?.length ? (
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
                      <th className="w-56 px-4 py-3" />
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
                          <div className="flex justify-end gap-2">
                            {row.targetUrl ? (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={row.targetUrl}>Przejdź</Link>
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8"
                              aria-label="Pokaż histogram ocen"
                              onClick={() =>
                                row.knowledgeBaseNodeId &&
                                setModalTarget({
                                  target: "article",
                                  id: row.knowledgeBaseNodeId,
                                  title: row.name ?? "Artykuł",
                                })
                              }
                            >
                              <BarChart3 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TableFooter pagination={kbPagination} total={kbSummaryCount} />
            </>
          )}
          <HistogramPanel
            target="article"
            source={source}
            details={details}
            categoryName={null}
            folderId={folderId}
          />
        </CardContent>
      </Card>

      <HistogramModal
        item={modalTarget}
        onClose={() => setModalTarget(null)}
        source={source}
        details={details}
      />
    </div>
  );
}
