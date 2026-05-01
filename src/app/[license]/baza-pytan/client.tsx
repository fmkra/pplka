"use client";

import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { Question } from "./question";
import { Spinner } from "~/components/ui/spinner";
import { useEffect, useMemo } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { type SelectOption } from "~/components/ui/select";
import usePagination from "~/app/_components/pagination";
import {
  CategoryFilter,
  type Category,
} from "../../_components/category-filter";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { MODE, useSearchState } from "~/lib/use-search-state";
import {
  useCachedLicenseVersion,
  useCachedQuestionsCountQuery,
  useCachedQuestionsQuery,
} from "~/offline/question-database-cache-hooks";
// import { LicenseFilter } from "./license-filter";

const pageSizeOptions: SelectOption[] = [
  { value: "5", label: "5 pytań" },
  { value: "10", label: "10 pytań" },
  { value: "20", label: "20 pytań" },
  { value: "50", label: "50 pytań" },
  { value: "100", label: "100 pytań" },
];

export default function QuestionsPageClient({
  categories,
  licenseId,
}: {
  categories: Category[];
  licenseId: number;
}) {
  const { cachedVersion, isReady: isCachedVersionReady } =
    useCachedLicenseVersion(licenseId);

  const [search, setSearch] = useSearchState("wyszukiwanie", MODE.empty);
  const searchDebounced = useDebounce(search ?? "", 500);

  const [selectedCategoriesStr, setSelectedCategoriesStr] = useSearchState(
    "przedmioty",
    MODE.emptyIsNull,
  );
  const selectedCategories = useMemo(() => {
    if (selectedCategoriesStr === null) return null;
    const ids = selectedCategoriesStr
      .split(",")
      .map((v) => categories.find((c) => c.name === v)?.id);
    return ids.every((id) => id !== undefined) ? ids : null;
  }, [selectedCategoriesStr, categories]);
  const setSelectedCategories = (value: number[] | null) => {
    if (value === null) {
      setSelectedCategoriesStr(null);
    } else {
      setSelectedCategoriesStr(
        value
          .map((id) => categories.find((c) => c.id === id)?.name)
          .filter((name) => name !== undefined)
          .join(","),
      );
    }
  };

  // null - no filter
  // "any" - show only with explanations
  // other string - show only with explanation with this id
  const [knowledgeBaseId, setKnowledgeBaseId] = useSearchState(
    "wyjasnienie",
    MODE.nullable,
  );

  const categoriesMapping = useMemo(() => {
    const output = {} as Record<number, Category>;
    for (const category of categories) {
      output[category.id] = category;
    }
    return output;
  }, [categories]);

  const { data: totalCount, isLoading: countLoading } =
    useCachedQuestionsCountQuery({
      licenseId,
      search: searchDebounced ?? "",
      categoryIds: selectedCategories ?? categories.map((c) => c.id),
      knowledgeBaseId,
    });

  const pagination = usePagination(pageSizeOptions, "20", totalCount);

  const setCurrentPage = pagination.setCurrentPage;
  useEffect(() => {
    setCurrentPage(1);
  }, [setCurrentPage, searchDebounced, selectedCategoriesStr]);

  const { data: questions, isLoading: questionsLoading } =
    useCachedQuestionsQuery({
      licenseId,
      search: searchDebounced,
      categoryIds: selectedCategories ?? categories.map((c) => c.id),
      knowledgeBaseId,
      limit: pagination.limit,
      offset: pagination.offset,
    });

  const { data: licensesData } = api.questionDatabase.getLicenses.useQuery(
    undefined,
    {
      enabled: isCachedVersionReady && cachedVersion !== null,
      staleTime: 30_000,
    },
  );
  const serverVersion = licensesData?.find(
    (license) => license.id === licenseId,
  );

  const isCacheOutdated =
    cachedVersion !== null &&
    serverVersion !== undefined &&
    cachedVersion !== serverVersion.version;

  const isLoading = questionsLoading || countLoading;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        {isCacheOutdated ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Wykryto nowszą wersję pytań na serwerze. Możesz dalej używać
            pobranej bazy offline, ale zalecane jest usunięcie i ponowne
            pobranie pytań.
          </div>
        ) : null}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Przeglądaj pytania..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* <div className="w-32">{pagination.pageSizeSelector}</div> */}
          {/* <LicenseFilter
          selectedLicenses={selectedLicenses}
          onLicensesChange={setSelectedLicenses}
        /> */}
          <CategoryFilter
            // licenseIds={selectedLicenses}
            categories={categories}
            selectedCategories={selectedCategories ?? []}
            onCategoriesChange={setSelectedCategories}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-only-with-explanations"
            checked={knowledgeBaseId !== null}
            onCheckedChange={(checked) =>
              setKnowledgeBaseId(checked ? "any" : null)
            }
          />
          <Label
            htmlFor="show-only-with-explanations"
            className="text-muted-foreground"
          >
            {knowledgeBaseId === null || knowledgeBaseId === "any"
              ? "Wyświetl tylko pytania z wyjaśnieniami"
              : "Wyświetl tylko pytania powiązane z tym materiałem"}
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-muted-foreground">Ładowanie...</p>
          </div>
        </div>
      ) : !questions || questions.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Nie znaleziono pytań</p>
          </div>
        </div>
      ) : (
        <>
          <div className="text-muted-foreground mb-4 flex items-center justify-between text-sm">
            <span>
              Pokazano {pagination.currentPageRange} z {totalCount ?? 0} pytań
            </span>
          </div>

          <div className="mb-6 grid gap-6">
            {questions.map((q) => (
              // <Question question={q} key={q.question.id} showLicense={true} />
              <Question
                key={q.questionInstance.id}
                question={q.question}
                hasExplanation={q.hasExplanation}
                category={categoriesMapping[q.questionInstance.categoryId]!}
              />
            ))}
          </div>

          {/* {pagination.footer} */}
          <div className="mt-8 flex flex-wrap items-center gap-y-4">
            <div className="ml-auto">{pagination.footer}</div>
            <div className="ml-auto flex items-center gap-2">
              <p className="text-sm">Ilość na stronę: </p>
              <div className="w-36">{pagination.pageSizeSelector}</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
