"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { LICENSE_SEARCH_PARAM, LICENSES, QUESTIONS } from "~/app/links";

export function QuestionBackLink({ licenses }: { licenses: string[] }) {
  const searchParams = useSearchParams();
  const requestedLicense = searchParams.get(LICENSE_SEARCH_PARAM);
  const license =
    requestedLicense &&
    LICENSES.includes(requestedLicense) &&
    licenses.includes(requestedLicense)
      ? requestedLicense
      : licenses[0]!;

  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={`/${license}/${QUESTIONS}`}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót do bazy pytań
      </Link>
    </Button>
  );
}
