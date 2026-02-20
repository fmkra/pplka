import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { categories } from "~/server/db/category";
import { licenses } from "~/server/db/license";
import { Button } from "~/components/ui/button";
import * as icons from "lucide-react";
import Link from "next/link";
import { getIcon } from "~/lib/get-icon";
import { CategoryLearningClient } from "./category-learning-client";
import { LEARN } from "~/app/links";

export default async function LearnCategoryPage({
  params,
}: {
  params: Promise<{ category: string; license: string }>;
}) {
  const { category: categoryUrl, license: licenseUrl } = await params;

  const categoryData = (
    await db
      .select({
        id: categories.id,
        name: categories.name,
        url: categories.url,
        color: categories.color,
        icon: categories.icon,
        licenseId: categories.licenseId,
      })
      .from(categories)
      .leftJoin(licenses, eq(categories.licenseId, licenses.id))
      .where(and(eq(categories.url, categoryUrl), eq(licenses.url, licenseUrl)))
      .groupBy(categories.id)
      .limit(1)
  )[0];

  if (!categoryData) {
    notFound();
  }

  return (
    <div className="flex min-h-[calc(100vh_-_12rem)] flex-col">
      <div className="mb-8 shrink-0">
        <div className="mb-4 flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${licenseUrl}/${LEARN}`}>
              <icons.ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do przedmiotów
            </Link>
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <h1 className="mb-2 flex items-center text-3xl font-bold">
            <div className="relative mr-2 h-8 w-8">
              {getIcon(
                categoryData.icon,
                null,
                categoryData.color?.split(",")[0],
              )}
            </div>
            {categoryData.name}
          </h1>
        </div>
      </div>

      <div className="my-auto flex shrink items-center justify-center">
        <CategoryLearningClient category={categoryData} />
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const pages = await db
    .select()
    .from(categories)
    .innerJoin(licenses, eq(categories.licenseId, licenses.id));
  return pages.map((page) => ({
    category: page.category.url,
    license: page.license.url,
  }));
}
