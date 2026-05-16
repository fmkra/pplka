import Main from "~/app/_components/main";
import ExamAttempt from "./client";

export default function ExamAttemptPage() {
  return (
    <Main>
      <ExamAttempt />
    </Main>
  );
}

export function generateStaticParams() {
  return [];
}
