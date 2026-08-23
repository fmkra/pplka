import type { Metadata } from "next";
import Main from "~/app/_components/main";
import OfflineExamShell from "./client";
import { ExamModeProvider } from "~/app/[license]/egzamin/exam-mode";

export const metadata: Metadata = {
  title: "Egzamin offline",
  robots: { index: false, follow: false },
};

export default function OfflineExamPage() {
  return (
    <Main>
      <ExamModeProvider>
        <OfflineExamShell />
      </ExamModeProvider>
    </Main>
  );
}
