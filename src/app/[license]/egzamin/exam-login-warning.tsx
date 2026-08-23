"use client";

import LoginWarning from "~/app/_components/login-warning";

export default function ExamLoginWarning() {
  return (
    <LoginWarning
      header="aby zapisywać egzaminy na koncie"
      description="W trybie online musisz być zalogowany, aby rozpocząć egzamin i zapisywać postęp na koncie."
    />
  );
}
