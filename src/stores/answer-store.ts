import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AnswerStore {
  answers: Record<string, number | undefined>;

  // Actions
  clearAnswers: () => void;
  answerState: (
    questionId: string,
  ) => [number | null, (answer: number | null) => void];
}

// TODO: should answers be stored per question or per question instance?
export const useAnswerStore = create<AnswerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      answers: {},

      // Actions
      clearAnswers: () => set({ answers: {} }),
      answerState: (questionId) => {
        const answers = get().answers;
        return [
          answers[questionId] ?? null,
          (answer) => {
            set((state) => ({
              answers: { ...state.answers, [questionId]: answer ?? undefined },
            }));
          },
        ];
      },
    }),
    {
      name: "answer-store",
    },
  ),
);
