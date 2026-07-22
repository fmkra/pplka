"use client";

import { useSearchParams } from "next/navigation";
import { Footer } from "~/app/_components/footer";
import { LICENSE_SEARCH_PARAM, LICENSES } from "~/app/links";

export function KnowledgeBaseFooter() {
  const searchParams = useSearchParams();
  const requestedLicense = searchParams.get(LICENSE_SEARCH_PARAM);
  const license =
    requestedLicense && LICENSES.includes(requestedLicense)
      ? requestedLicense
      : LICENSES[0]!;

  return <Footer license={license} />;
}
