"use client";

import { useSearchParams } from "next/navigation";
import { Footer } from "~/app/_components/footer";
import { KNOWLEDGE_BASE_LICENSE, LICENSES } from "~/app/links";

export function KnowledgeBaseFooter() {
  const searchParams = useSearchParams();
  const requestedLicense = searchParams.get(KNOWLEDGE_BASE_LICENSE);
  const license =
    requestedLicense && LICENSES.includes(requestedLicense)
      ? requestedLicense
      : LICENSES[0]!;

  return <Footer license={license} />;
}
