import type { MetadataRoute } from "next";
import { EXAM, KNOWLEDGE_BASE, LEARN, LICENSES, QUESTIONS, TOS } from "./links";

const BASE_URL = "https://www.pplka.pl";

export default function sitemap(): MetadataRoute.Sitemap {
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
            priority: 0.3,
          },
        ] as const,
    ),
  ];
}
