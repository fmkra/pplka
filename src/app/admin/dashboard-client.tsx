"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
  action,
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
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2 leading-tight">
          {icon}
          <span>{title}</span>
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center">
            {emptyMessage}
          </p>
        ) : (
          <div className="relative h-[360px] w-full pt-6">
            <div className="text-muted-foreground pointer-events-none absolute top-0 left-0 text-sm">
              {leftLabel}
            </div>
            <div className="text-muted-foreground pointer-events-none absolute top-0 right-0 text-sm">
              {rightLabel}
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatChartDate} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
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
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [range, setRange] = useState<DashboardRange>("month");
  const { data, isLoading } = api.admin.getDashboard.useQuery({ range });

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

      <DashboardChart
        title="Aktywność egzaminów"
        icon={<Users className="h-5 w-5 shrink-0" />}
        data={data.examActivity}
        leftLabel="Egzaminy"
        rightLabel="Użytkownicy"
        emptyMessage="Brak egzaminów do wyświetlenia."
        action={
          <div className="w-full md:w-44">
            <Select
              options={rangeOptions}
              value={range}
              onValueChange={(value) => setRange(value as DashboardRange)}
            />
          </div>
        }
        lines={[
          {
            axis: "left",
            dataKey: "exams",
            name: "Ilość egzaminów",
            stroke: "var(--chart-2)",
          },
          {
            axis: "right",
            dataKey: "users",
            name: "Unikalni użytkownicy",
            stroke: "var(--chart-1)",
          },
        ]}
      />

      <DashboardChart
        title="Aktywność nauki"
        icon={<BookOpen className="h-5 w-5 shrink-0" />}
        data={data.learningUsage}
        leftLabel="Aktywności"
        rightLabel="Użytkownicy"
        emptyMessage="Brak aktywności nauki do wyświetlenia."
        lines={[
          {
            axis: "left",
            dataKey: "activities",
            name: "Ilość aktywności nauki",
            stroke: "var(--chart-2)",
          },
          {
            axis: "right",
            dataKey: "users",
            name: "Unikalni użytkownicy",
            stroke: "var(--chart-1)",
          },
        ]}
      />

      <DashboardChart
        title="Użytkownicy"
        icon={<UserPlus className="h-5 w-5 shrink-0" />}
        data={data.userActivity}
        leftLabel="Nowi użytkownicy"
        rightLabel="Aktywni użytkownicy"
        emptyMessage="Brak aktywności użytkowników do wyświetlenia."
        lines={[
          {
            axis: "left",
            dataKey: "newUsers",
            name: "Nowi użytkownicy",
            stroke: "var(--chart-3)",
          },
          {
            axis: "right",
            dataKey: "activeUsers",
            name: "Aktywni użytkownicy",
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
