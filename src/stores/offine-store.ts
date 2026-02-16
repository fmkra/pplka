import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GetQuestionsResponse } from "~/server/api/routers/download";
import type { GetExamResponse } from "~/server/api/routers/exam";

type ExamAttempt = Exclude<GetExamResponse, null>[0];
export type CategoryData = {
  examTime: number;
  examQuestionCount: number;
};
type QuestionData = GetQuestionsResponse[number];

interface OfflineStore {
  categories: Record<string, CategoryData>;
  questions: Record<string, QuestionData>;
  categoryQuestions: Record<string, string[]>;
  licenseCategories: Record<string, string[]>;

  examAttempts: Record<string, ExamAttempt>;
  perLicenseAttempts: Record<string, string[]>;

  licenseProgress: Record<string, { progress: number; total: number }>;

  _isHydrated: boolean;

  // Actions
  removeCategoryQuestions: (categoryId: number) => void;
  saveCategoryQuestions: (
    categoryId: number,
    category: CategoryData,
    questions: QuestionData[],
  ) => void;
  saveLicense: (licenseId: number, categories: number[]) => void;
  removeLicense: (licenseId: number) => void;
  updateLicenseProgress: (
    licenseId: number,
    progress: number,
    total: number,
  ) => void;
  getLicenseProgress: (licenseId: number) => number | boolean;

  setHydrated: () => void;
  isHydrated: () => boolean;
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      // Initial state
      categories: {},
      examAttempts: {},
      perLicenseAttempts: {},
      questions: {},
      categoryQuestions: {},
      licenseCategories: {},
      licenseProgress: {},

      _isHydrated: false,

      // Actions
      saveCategoryQuestions: (
        categoryId: number,
        category: CategoryData,
        questions: QuestionData[],
      ) => {
        set((state) => ({
          categories: {
            ...state.categories,
            [categoryId]: category,
          },
          questions: {
            ...state.questions,
            ...questions.reduce(
              (acc, question) => {
                acc[question.id] = question;
                return acc;
              },
              {} as Record<string, QuestionData>,
            ),
          },
          categoryQuestions: {
            ...state.categoryQuestions,
            [categoryId]: [
              ...(state.categoryQuestions[categoryId] ?? []),
              ...questions.map((question) => question.id),
            ],
          },
        }));
      },
      removeCategoryQuestions: (categoryId: number) => {
        set((state) => ({
          categoryQuestions: {
            ...state.categoryQuestions,
            [categoryId]: undefined,
          },
        }));
      },
      saveLicense: (licenseId: number, categories: number[]) => {
        set((state) => ({
          licenseCategories: {
            ...state.licenseCategories,
            [licenseId]: categories,
          },
          licenseProgress: {
            ...state.licenseProgress,
            [licenseId]: undefined,
          },
        }));
      },
      removeLicense: (licenseId: number) => {
        set((state) => ({
          licenseCategories: {
            ...state.licenseCategories,
            [licenseId]: undefined,
          },
          licenseProgress: {
            ...state.licenseProgress,
            [licenseId]: undefined,
          },
        }));
      },
      updateLicenseProgress: (
        licenseId: number,
        progress: number,
        total: number,
      ) => {
        set((state) => ({
          licenseProgress: {
            ...state.licenseProgress,
            [licenseId]: {
              progress,
              total,
            },
          },
        }));
      },
      getLicenseProgress: (licenseId: number): number | boolean => {
        const p = get().licenseProgress[licenseId];
        if (p === undefined)
          return get().licenseCategories[licenseId] !== undefined;
        return Math.round((100 * p.progress) / p.total);
      },
      setHydrated: () => {
        set((state) => ({
          ...state,
          _isHydrated: true,
        }));
      },
      isHydrated: () => {
        return get()._isHydrated;
      },
    }),
    {
      name: "offline-store",
      onRehydrateStorage: (state) => {
        return () => state.setHydrated();
      },
    },
  ),
);
