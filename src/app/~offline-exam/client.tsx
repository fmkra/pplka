"use client";

import { usePathname } from "next/navigation";
import ExamAttempt from "~/app/[license]/egzamin/[exam_id]/client";

export default function OfflineExamShell() {
  const pathname = usePathname();
  const examId = pathname.split("/").filter(Boolean).at(-1);

  return <ExamAttempt examId={examId} />;
}
