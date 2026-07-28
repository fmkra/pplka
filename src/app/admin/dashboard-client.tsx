"use client";

import Link from "next/link";
import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, MessageSquare, Star, UserPlus, Users } from "lucide-react";
import { ADMIN, COMMENTS, FEEDBACK } from "~/app/links";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, type SelectOption } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";

const rangeOptions = [
  { value: "week", label: "Tydzień" },
  { value: "month", label: "Miesiąc" },
  { value: "threeMonths", label: "3 miesiące" },
  { value: "year", label: "Rok" },
] as const satisfies SelectOption[];

type DashboardRange = (typeof rangeOptions)[number]["value"];

const segmentScopeOptions = [
  { value: "allTime", label: "Cały okres" },
  { value: "activityInRange", label: "Aktywność w wybranym okresie" },
  { value: "usersInRange", label: "Użytkownicy z wybranego okresu" },
] as const satisfies SelectOption[];

type UserSegmentScope = (typeof segmentScopeOptions)[number]["value"];

const segmentColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

function formatChartDate(date: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function MetricCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: number;
  description?: string;
  href?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-bold">
            {value.toLocaleString("pl-PL")}
          </div>
          {description ? (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          ) : null}
        </div>
        {href ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={href}>Zobacz</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DashboardChart<T extends { date: string }>({
  title,
  icon,
  data,
  leftLabel,
  rightLabel,
  lines,
  emptyMessage,
  footnote,
}: {
  title: string;
  icon: React.ReactNode;
  data: T[];
  leftLabel: string;
  rightLabel: string;
  lines: Array<{
    axis: "left" | "right";
    dataKey: string;
    name: string;
    stroke: string;
  }>;
  emptyMessage: string;
  footnote?: string;
}) {
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 leading-tight">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {data.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center">
            {emptyMessage}
          </p>
        ) : (
          <div>
            <div className="relative h-[360px] w-full pt-6">
              <div className="text-muted-foreground pointer-events-none absolute top-0 left-10 text-sm sm:left-12">
                {leftLabel}
              </div>
              <div className="text-muted-foreground pointer-events-none absolute top-0 right-10 text-sm sm:right-12">
                {rightLabel}
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ right: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    minTickGap={24}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    allowDecimals={false}
                    width={40}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    width={40}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    labelFormatter={(label) => formatChartDate(String(label))}
                  />
                  <Legend />
                  {lines.map((line) => (
                    <Line
                      key={line.dataKey}
                      type="linear"
                      yAxisId={line.axis}
                      dataKey={line.dataKey}
                      name={line.name}
                      stroke={line.stroke}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {footnote ? (
              <p className="text-muted-foreground px-10 pt-1 text-xs sm:px-12">
                {footnote}
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserSegmentsChart({ range }: { range: DashboardRange }) {
  const [scope, setScope] = useState<UserSegmentScope>("allTime");
  const { data, isLoading, isFetching } = api.admin.getUserSegments.useQuery(
    { range, scope },
    { placeholderData: keepPreviousData },
  );
  const chartData = (data ?? []).map((segment, index) => ({
    ...segment,
    name:
      segment.hasExam && segment.hasLearning
        ? "Egzamin i nauka"
        : segment.hasExam
          ? "Tylko egzamin"
          : segment.hasLearning
            ? "Tylko nauka"
            : "Bez egzaminu i nauki",
    fill: segmentColors[index],
  }));
  const total = chartData.reduce((sum, segment) => sum + segment.users, 0);

  return (
    <Card>
      <CardHeader className="gap-4 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <CardTitle className="flex items-center gap-2 leading-tight">
            <Users className="h-5 w-5 shrink-0" />
            <span>Użytkownicy według sposobu korzystania</span>
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-sm" aria-live="polite">
            {isFetching
              ? "Aktualizowanie danych…"
              : `${total.toLocaleString("pl-PL")} użytkowników`}
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Select
            options={segmentScopeOptions}
            value={scope}
            onValueChange={(value) => setScope(value as UserSegmentScope)}
          />
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {isLoading ? (
          <div className="flex h-[360px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : total === 0 ? (
          <p className="text-muted-foreground py-10 text-center">
            Brak użytkowników do wyświetlenia.
          </p>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="users"
                  nameKey="name"
                  cx="50%"
                  cy="46%"
                  innerRadius="38%"
                  outerRadius="68%"
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${String(name)} (${((percent ?? 0) * 100).toFixed(1)}%)`
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString("pl-PL")} użytkowników`,
                    "Liczba",
                  ]}
                />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [range, setRange] = useState<DashboardRange>("month");
  const { data, isLoading, isFetching } = api.admin.getDashboard.useQuery(
    { range },
    { placeholderData: keepPreviousData },
  );

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Użytkownicy" value={data.totals.users} />
        <MetricCard
          title="Egzaminy"
          value={data.totals.exams}
          description={`Unikalni użytkownicy: ${data.totals.finishedExamUsers.toLocaleString("pl-PL")}`}
        />
        <MetricCard
          title="Sesje nauki"
          value={data.totals.learningSessions}
          description={`Unikalni użytkownicy: ${data.totals.learningUsers.toLocaleString("pl-PL")}`}
        />
        <MetricCard
          title="Feedback"
          value={data.totals.feedback}
          href={`/${ADMIN}/${FEEDBACK}`}
        />
        <MetricCard
          title="Komentarze"
          value={data.totals.comments}
          href={`/${ADMIN}/${COMMENTS}`}
        />
      </div>

      <Card className="bg-background/95 sticky top-4 z-10 py-4 shadow-md backdrop-blur">
        <CardContent className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-medium">Zakres wykresów</p>
            <p className="text-muted-foreground text-sm" aria-live="polite">
              {isFetching
                ? "Aktualizowanie danych…"
                : "Dotyczy wszystkich wykresów."}
            </p>
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={rangeOptions}
              value={range}
              onValueChange={(value) => setRange(value as DashboardRange)}
            />
          </div>
        </CardContent>
      </Card>

      <UserSegmentsChart range={range} />

      <DashboardChart
        title="Aktywność egzaminów"
        icon={<Users className="h-5 w-5 shrink-0" />}
        data={data.examActivity}
        leftLabel="Ogółem"
        rightLabel="Unikalnych*"
        emptyMessage="Brak egzaminów do wyświetlenia."
        footnote="* Ilość użytkowników z co najmniej jednym egzaminem."
        lines={[
          {
            axis: "left",
            dataKey: "exams",
            name: "Ogółem",
            stroke: "var(--chart-2)",
          },
          {
            axis: "right",
            dataKey: "users",
            name: "Unikalnych*",
            stroke: "var(--chart-1)",
          },
        ]}
      />

      <DashboardChart
        title="Aktywność nauki"
        icon={<BookOpen className="h-5 w-5 shrink-0" />}
        data={data.learningUsage}
        leftLabel="Ogółem"
        rightLabel="Unikalnych"
        emptyMessage="Brak aktywności nauki do wyświetlenia."
        lines={[
          {
            axis: "left",
            dataKey: "activities",
            name: "Ogółem",
            stroke: "var(--chart-2)",
          },
          {
            axis: "right",
            dataKey: "users",
            name: "Unikalnych",
            stroke: "var(--chart-1)",
          },
        ]}
      />

      <DashboardChart
        title="Użytkownicy"
        icon={<UserPlus className="h-5 w-5 shrink-0" />}
        data={data.userActivity}
        leftLabel="Nowi"
        rightLabel="Aktywni"
        emptyMessage="Brak aktywności użytkowników do wyświetlenia."
        lines={[
          {
            axis: "left",
            dataKey: "newUsers",
            name: "Nowi",
            stroke: "var(--chart-3)",
          },
          {
            axis: "right",
            dataKey: "activeUsers",
            name: "Aktywni",
            stroke: "var(--chart-1)",
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Feedback treści
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Najnowsze oceny i podsumowania dla pytań oraz artykułów.
            </p>
            <Button asChild>
              <Link href={`/${ADMIN}/${FEEDBACK}`}>Przejdź</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Komentarze
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Najnowsze komentarze dodane pod pytaniami.
            </p>
            <Button asChild>
              <Link href={`/${ADMIN}/${COMMENTS}`}>Przejdź</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
