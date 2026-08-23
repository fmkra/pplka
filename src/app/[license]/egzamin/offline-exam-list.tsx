"use client";

import { CheckCircle, Clock, HardDrive } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  CategoryFilter,
  type Category,
} from "~/app/_components/category-filter";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { PASS_THRESHOLD } from "~/lib/utils";
import { useTimer } from "~/lib/use-timer";
import { useOfflineExamAttempts } from "~/offline/exam";
import { useExamMode } from "./exam-mode";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function calculateDuration(
  startedAt: Date,
  finishedAt: Date | null,
  maxTime: number,
  currentTime: Date,
) {
  const duration =
    (finishedAt?.getTime() ?? currentTime.getTime()) - startedAt.getTime();
  const totalSeconds = Math.min(Math.floor(duration / 1000), maxTime);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function OfflineExamList({
  licenseUrl,
  categories,
}: {
  licenseUrl: string;
  categories: Category[];
}) {
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const { isOfflineMode, withMode } = useExamMode();
  const attempts = useOfflineExamAttempts(licenseUrl, selectedCategories);
  const currentTime = useTimer(new Date());

  if (!isOfflineMode) return null;

  if (attempts === undefined) {
    return (
      <Card className="mt-8">
        <CardContent className="flex items-center justify-center py-7">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <section>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <HardDrive className="h-5 w-5" />
                Egzaminy offline
              </h1>
              <p className="text-muted-foreground mt-1 text-sm font-normal">
                Te egzaminy są zapisywane lokalnie na urządzeniu i nie są
                synchronizowane z twoim kontem.
              </p>
            </div>
            <CategoryFilter
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Brak egzaminów dla wybranych przedmiotów.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Data</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Przedmiot
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Postęp / Wynik
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Czas</th>
                    <th className="w-24 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => {
                    const correctCount = attempt.questions.filter(
                      (question) => question.answer === "A",
                    ).length;
                    const answeredCount = attempt.questions.filter(
                      (question) => question.answer !== null,
                    ).length;
                    const isFinished = attempt.finishedAt !== null;
                    const displayedCount = isFinished
                      ? correctCount
                      : answeredCount;
                    const percentage = Math.round(
                      (displayedCount / attempt.questions.length) * 100,
                    );
                    const passed =
                      correctCount >= PASS_THRESHOLD * attempt.questions.length;

                    return (
                      <tr
                        key={attempt.id}
                        className="hover:bg-muted/50 border-b"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {formatDate(attempt.startedAt)}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {attempt.categoryName}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              !isFinished
                                ? "secondary"
                                : passed
                                  ? "green"
                                  : "destructive"
                            }
                            className="flex items-center gap-1"
                          >
                            {isFinished && passed ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                            {!isFinished
                              ? "W trakcie"
                              : passed
                                ? "Zaliczony"
                                : "Niezaliczony"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {displayedCount}/{attempt.questions.length}
                            </span>
                            <div className="bg-muted h-2 w-16 rounded-full">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {calculateDuration(
                            new Date(attempt.startedAt),
                            attempt.finishedAt
                              ? new Date(attempt.finishedAt)
                              : null,
                            attempt.examTime,
                            currentTime,
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="outline" className="w-full" asChild>
                            <Link
                              href={withMode(
                                `/${licenseUrl}/egzamin/${attempt.id}`,
                              )}
                              prefetch={false}
                              onClick={(event) => {
                                if (!navigator.onLine) {
                                  event.preventDefault();
                                  window.location.assign(
                                    withMode(
                                      `/${licenseUrl}/egzamin/${attempt.id}`,
                                    ),
                                  );
                                }
                              }}
                            >
                              {isFinished ? "Zobacz" : "Kontynuuj"}
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
