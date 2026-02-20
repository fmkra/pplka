import { db } from "~/server/db";
import { categories } from "~/server/db/category";
import { eq } from "drizzle-orm";
import { CardHeader, CardTitle, CardContent, Card } from "~/components/ui/card";
import { getIcon } from "~/lib/get-icon";
import CategoryStartButton from "./category-start-button";
import { BookOpen, Clock } from "lucide-react";
import { conjugate } from "~/lib/utils";

export default async function ExamStart({ licenseId }: { licenseId: number }) {
  const categoryList = await db
    .select()
    .from(categories)
    .where(eq(categories.licenseId, licenseId));

  return (
    <div>
      <h1 className="my-6 text-center text-3xl font-bold">
        Rozpocznij nowy egzamin
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categoryList.map((category) => (
          <Card key={category.id} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    {getIcon(
                      category.icon,
                      null,
                      category.color?.split(",")[0],
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex h-full flex-col">
              {/* <CardDescription className="mb-4 text-sm">
                  {categorydescription}
                </CardDescription> */}

              <div className="text-muted-foreground mt-auto mb-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {category.examTime / 60} min
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {category.examQuestionCount}{" "}
                  {conjugate(
                    category.examQuestionCount,
                    "pytanie",
                    "pytania",
                    "pytań",
                  )}
                </div>
              </div>

              <CategoryStartButton categoryId={category.id}>
                Start
              </CategoryStartButton>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
