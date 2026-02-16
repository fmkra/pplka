import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import * as icons from "lucide-react";
import { db } from "~/server/db";
import { questionInstances } from "~/server/db/question";
import { licenses } from "~/server/db/license";
import { categories } from "~/server/db/category";
import { count, eq } from "drizzle-orm";
import { conjugate, formatTime, MINUTES_PER_QUESTION } from "~/lib/utils";
import { notFound } from "next/navigation";
import { getIcon } from "~/lib/get-icon";
import CardUserProgress from "./user-progress";
import LoginWarning from "../../_components/login-warning";
import { metadataBuilder } from "~/app/seo";
import { DownloadComponent } from "./download";

export const generateMetadata = metadataBuilder((url, name) => ({
  title: `Tryb nauki - ${name.short}`,
  description: `Interaktywna nauka do egzaminu na licencję ${name.short}. Pytania z kategorii: prawo lotnicze, nawigacja, meteorologia i więcej.`,
}));

export default async function LearnPage({
  params,
}: {
  params: Promise<{ license: string }>;
}) {
  const { license: licenseUrl } = await params;
  const licenseData = (
    await db.select().from(licenses).where(eq(licenses.url, licenseUrl))
  )[0];

  if (!licenseData) {
    notFound();
  }

  const cardsWithCounts = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      url: categories.url,
      description: categories.description,
      icon: categories.icon,
      topics: categories.topics,
      questionCount: count(questionInstances.id),
    })
    .from(categories)
    .leftJoin(
      questionInstances,
      eq(categories.id, questionInstances.categoryId),
    )
    .where(eq(categories.licenseId, licenseData.id))
    .groupBy(categories.id)
    .orderBy(categories.id);

  return (
    <>
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Tryb nauki</h1>
        <p className="text-muted-foreground">
          Przejdź przez wszystkie dostępne pytania egzaminacyjne. Pytania, na
          które odpowiesz poprawnie, nie pojawią się w danej sesji nauki
          ponownie. Po przejściu przez wszystkie pytania, możesz rozpocząć
          kolejne podejście, w którym pojawią się jedynie pytania, na które
          odpowiedziano błędnie.
        </p>
      </div>

      <DownloadComponent licenseId={licenseData.id} />

      <LoginWarning
        header="aby uzyskać dostęp do nauki"
        description="Musisz być zalogowany, aby rozpocząć naukę i śledzić swój postęp."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cardsWithCounts.map((card) => (
          <Card key={card.id} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    {getIcon(card.icon, null, card.color?.split(",")[0])}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex h-full flex-col">
              <CardDescription className="mb-4 text-sm">
                {card.description}
              </CardDescription>

              <div className="text-muted-foreground mb-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <icons.Clock className="h-4 w-4" />
                  {formatTime(card.questionCount * MINUTES_PER_QUESTION)}
                </div>
                <div className="flex items-center gap-1">
                  <icons.BookOpen className="h-4 w-4" />
                  {card.questionCount}{" "}
                  {conjugate(card.questionCount, "pytanie", "pytania", "pytań")}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium">Tematy:</h4>
                <div className="flex flex-wrap gap-1">
                  {card.topics?.map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <CardUserProgress
                licenseId={licenseData.id}
                licenseUrl={licenseUrl}
                category={card}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const licensesData = await db.select().from(licenses);
  return licensesData.map((license) => ({
    license: license.url,
  }));
}
