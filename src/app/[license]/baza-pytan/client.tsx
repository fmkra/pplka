"use client";

import { RotateCcw, Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Question } from "./question";
import { Spinner } from "~/components/ui/spinner";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { type SelectOption } from "~/components/ui/select";
import usePagination from "~/app/_components/pagination";
import {
  CategoryFilter,
  type Category,
} from "../../_components/category-filter";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { MODE, useSearchState } from "~/lib/use-search-state";
import {
  useCachedQuestionsCountQuery,
  useCachedQuestionsQuery,
} from "~/offline/question-database-cache-hooks";
import {
  QUESTIONS_CATEGORIES,
  QUESTIONS_KNOWLEDGE_BASE_ID,
  QUESTIONS_SEARCH,
} from "~/app/links";
import { useAnswerStore } from "~/stores";
import { conjugate } from "~/lib/utils";
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
  licenseUrl,
}: {
  categories: Category[];
  licenseId: number;
  licenseUrl: string;
}) {
  return (
    <Suspense fallback={<QuestionsPageFallback />}>
      <QuestionsPageContent
        categories={categories}
        licenseId={licenseId}
        licenseUrl={licenseUrl}
      />
    </Suspense>
  );
}

function QuestionsPageContent({
  categories,
  licenseId,
  licenseUrl,
}: {
  categories: Category[];
  licenseId: number;
  licenseUrl: string;
}) {
  const [search, setSearch] = useSearchState(QUESTIONS_SEARCH, MODE.empty);
  const searchDebounced = useDebounce(search ?? "", 500);

  const [selectedCategoriesStr, setSelectedCategoriesStr] = useSearchState(
    QUESTIONS_CATEGORIES,
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
    QUESTIONS_KNOWLEDGE_BASE_ID,
    MODE.nullable,
  );

  const savedAnswerCount = useAnswerStore(
    (state) =>
      Object.values(state.answers).filter((answer) => answer !== undefined)
        .length,
  );
  const clearAnswers = useAnswerStore((state) => state.clearAnswers);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const resetAnswers = () => {
    clearAnswers();
    setIsResetModalOpen(false);
  };

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
      licenseUrl,
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
      licenseUrl,
      search: searchDebounced,
      categoryIds: selectedCategories ?? categories.map((c) => c.id),
      knowledgeBaseId,
      limit: pagination.limit,
      offset: pagination.offset,
    });

  const isLoading = questionsLoading || countLoading;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Wyszukaj..."
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
        <div className="flex flex-wrap items-center gap-2">
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
          <Button
            className="ml-auto"
            variant="outline"
            size="sm"
            disabled={savedAnswerCount === 0}
            onClick={() => setIsResetModalOpen(true)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Wyczyść odpowiedzi
          </Button>
        </div>
      </div>

      {isResetModalOpen && (
        <ResetAnswersModal
          answerCount={savedAnswerCount}
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={resetAnswers}
        />
      )}

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
                showCommentsButton
                licenseUrl={licenseUrl}
                searchHighlight={searchDebounced.trim() || undefined}
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

function ResetAnswersModal({
  answerCount,
  onClose,
  onConfirm,
}: {
  answerCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-answers-title"
        aria-describedby="reset-answers-description"
        className="bg-card w-full max-w-md rounded-xl border p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="reset-answers-title" className="text-lg font-semibold">
          Wyczyść odpowiedzi
        </h2>
        <p
          id="reset-answers-description"
          className="text-muted-foreground mt-2 text-sm"
        >
          Czy na pewno chcesz usunąć {answerCount}{" "}
          {conjugate(
            answerCount,
            "zapisaną odpowiedź",
            "zapisane odpowiedzi",
            "zapisanych odpowiedzi",
          )}
          ?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} autoFocus>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Wyczyść odpowiedzi
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionsPageFallback() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Wyszukaj..."
              className="pl-10"
              value=""
              disabled
              readOnly
            />
          </div>
          <Button variant="outline" disabled>
            Wszystkie przedmioty
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="show-only-with-explanations-loading" disabled />
          <Label
            htmlFor="show-only-with-explanations-loading"
            className="text-muted-foreground"
          >
            Wyświetl tylko pytania z wyjaśnieniami
          </Label>
        </div>
      </div>

      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    </>
  );
}
