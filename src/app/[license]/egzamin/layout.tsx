import { ExamModeProvider } from "./exam-mode";

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ExamModeProvider>{children}</ExamModeProvider>;
}
