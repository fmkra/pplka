import type { MetadataRoute } from "next";
import { EXAM, KNOWLEDGE_BASE, LEARN, LICENSES, QUESTIONS, TOS } from "./links";
import { db } from "~/server/db";
import { knowledgeBaseNodes } from "~/server/db/knowledgeBase";
import { isNotNull } from "drizzle-orm";

const BASE_URL = "https://www.pplka.pl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const knowledgeBaseSlugs = await db
    .select({ slug: knowledgeBaseNodes.slug })
    .from(knowledgeBaseNodes)
    .where(isNotNull(knowledgeBaseNodes.slug));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/${TOS}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0,
    },
    ...LICENSES.flatMap(
      (license) =>
        [
          {
            url: `${BASE_URL}/${license}`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1,
          },
          {
            url: `${BASE_URL}/${license}/${LEARN}`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
          },
          {
            url: `${BASE_URL}/${license}/${EXAM}`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
          },
          {
            url: `${BASE_URL}/${license}/${QUESTIONS}`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3,
          },
          {
            url: `${BASE_URL}/${license}/${KNOWLEDGE_BASE}`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.1,
          },
          ...knowledgeBaseSlugs.map(
            (slug) =>
              ({
                url: `${BASE_URL}/${license}/${KNOWLEDGE_BASE}/${slug.slug}`,
                lastModified: new Date(),
                changeFrequency: "monthly",
                priority: 0.5,
              }) as const,
          ),
        ] as const,
    ),
  ];
}
