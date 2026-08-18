import type { MetadataRoute } from "next";
import { asc, eq, isNotNull, max } from "drizzle-orm";
import { staticPageUpdatedAt } from "~/content/static-page-updated-at";
import { getLatestContentRevisions } from "~/server/content-revisions";
import { db } from "~/server/db";
import { categories } from "~/server/db/category";
import { knowledgeBaseNodes } from "~/server/db/knowledgeBase";
import { licenses } from "~/server/db/license";
import { questionInstances, questions } from "~/server/db/question";
import { EXAM, KNOWLEDGE_BASE, LEARN, QUESTIONS, TOS } from "./links";

const BASE_URL = "https://www.pplka.pl";

type DateValue = Date | string | null | undefined;

function latestDate(...values: DateValue[]) {
  const dates = values
    .filter((value): value is Date | string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));
  return new Date(Math.max(0, ...dates.map((date) => date.getTime())));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    knowledgeBaseEntries,
    questionEntries,
    licenseEntries,
    licenseQuestionDates,
    revisions,
  ] = await Promise.all([
    db
      .select({
        slug: knowledgeBaseNodes.slug,
        createdAt: knowledgeBaseNodes.createdAt,
        updatedAt: knowledgeBaseNodes.updatedAt,
      })
      .from(knowledgeBaseNodes)
      .where(isNotNull(knowledgeBaseNodes.slug)),
    db
      .select({
        id: questions.id,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
      })
      .from(questions),
    db.select().from(licenses).orderBy(asc(licenses.id)),
    db
      .select({
        licenseUrl: licenses.url,
        questionsUpdatedAt: max(questions.updatedAt),
        categoriesUpdatedAt: max(categories.updatedAt),
      })
      .from(licenses)
      .leftJoin(categories, eq(categories.licenseId, licenses.id))
      .leftJoin(
        questionInstances,
        eq(questionInstances.categoryId, categories.id),
      )
      .leftJoin(questions, eq(questions.id, questionInstances.questionId))
      .groupBy(licenses.id, licenses.url),
    getLatestContentRevisions(),
  ]);

  const licenseQuestionDateByUrl = new Map(
    licenseQuestionDates.map((entry) => [entry.licenseUrl, entry]),
  );
  const knowledgeBaseIndexPath = `/${KNOWLEDGE_BASE}`;
  const knowledgeBaseContentDate = latestDate(
    ...knowledgeBaseEntries.flatMap((entry) => [
      entry.createdAt,
      entry.updatedAt,
    ]),
  );

  return [
    {
      url: BASE_URL,
      lastModified: latestDate(
        staticPageUpdatedAt("/"),
        revisions.get("/"),
        ...licenseEntries.map((license) => license.updatedAt),
      ),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/${TOS}`,
      lastModified: latestDate(
        staticPageUpdatedAt("/regulamin"),
        revisions.get(`/${TOS}`),
      ),
      changeFrequency: "monthly",
      priority: 0,
    },
    {
      url: `${BASE_URL}${knowledgeBaseIndexPath}`,
      lastModified: latestDate(
        staticPageUpdatedAt("/baza-wiedzy"),
        knowledgeBaseContentDate,
        revisions.get(knowledgeBaseIndexPath),
      ),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...knowledgeBaseEntries.map((entry) => {
      const path = `/${KNOWLEDGE_BASE}/${encodeURIComponent(entry.slug!)}`;
      return {
        url: `${BASE_URL}${path}`,
        lastModified: latestDate(
          staticPageUpdatedAt("/baza-wiedzy/[slug]"),
          entry.createdAt,
          entry.updatedAt,
          revisions.get(path),
        ),
        changeFrequency: "monthly",
        priority: 0.5,
      } as const;
    }),
    ...questionEntries.map((entry) => {
      const path = `/${QUESTIONS}/${encodeURIComponent(entry.id)}`;
      return {
        url: `${BASE_URL}${path}`,
        lastModified: latestDate(
          staticPageUpdatedAt("/baza-pytan/[question_id]"),
          entry.createdAt,
          entry.updatedAt,
          revisions.get(path),
        ),
        changeFrequency: "monthly",
        priority: 0.6,
      } as const;
    }),
    ...licenseEntries.flatMap((license) => {
      const questionDates = licenseQuestionDateByUrl.get(license.url);
      const licensePath = `/${license.url}`;
      const learnPath = `${licensePath}/${LEARN}`;
      const examPath = `${licensePath}/${EXAM}`;
      const questionsPath = `${licensePath}/${QUESTIONS}`;
      const sharedDataDate = latestDate(
        license.createdAt,
        license.updatedAt,
        questionDates?.categoriesUpdatedAt,
      );
      const questionDataDate = latestDate(
        sharedDataDate,
        questionDates?.questionsUpdatedAt,
      );

      return [
        {
          url: `${BASE_URL}${licensePath}`,
          lastModified: latestDate(
            staticPageUpdatedAt("/[license]"),
            license.updatedAt,
            revisions.get(licensePath),
          ),
          changeFrequency: "monthly",
          priority: 1,
        },
        {
          url: `${BASE_URL}${learnPath}`,
          lastModified: latestDate(
            staticPageUpdatedAt("/[license]/nauka"),
            questionDataDate,
            revisions.get(learnPath),
          ),
          changeFrequency: "monthly",
          priority: 0.7,
        },
        {
          url: `${BASE_URL}${examPath}`,
          lastModified: latestDate(
            staticPageUpdatedAt("/[license]/egzamin"),
            questionDataDate,
            revisions.get(examPath),
          ),
          changeFrequency: "monthly",
          priority: 0.7,
        },
        {
          url: `${BASE_URL}${questionsPath}`,
          lastModified: latestDate(
            staticPageUpdatedAt("/[license]/baza-pytan"),
            questionDataDate,
            revisions.get(questionsPath),
          ),
          changeFrequency: "monthly",
          priority: 0.3,
        },
      ] as const;
    }),
  ];
}
