"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import LoginWarning from "~/app/_components/login-warning";
import { usePwaContext } from "~/app/_components/pwa-context";

export default function ExamLoginWarning() {
  const { status } = useSession();
  const { isOnline, isConnectivityKnown } = usePwaContext();
  const [wasConfirmedSignedOut, setWasConfirmedSignedOut] = useState(false);

  useEffect(() => {
    if (!isConnectivityKnown || !isOnline) return;

    if (status === "unauthenticated") {
      setWasConfirmedSignedOut(true);
    } else if (status === "authenticated") {
      setWasConfirmedSignedOut(false);
    }
  }, [isConnectivityKnown, isOnline, status]);

  if (!isConnectivityKnown || (!isOnline && !wasConfirmedSignedOut)) {
    return null;
  }

  return (
    <LoginWarning
      header="aby zapisywać egzaminy na koncie"
      description="W trybie online musisz być zalogowany, aby rozpocząć egzamin i zapisywać postęp na koncie."
    />
  );
}
