"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent } from "~/components/ui/card";
import { Info } from "lucide-react";
import LoginLink from "./login-link";

export default function LoginWarning({
  header,
  description,
}: {
  header: string;
  description: string;
}) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  if (session === undefined || isLoggedIn) {
    return null;
  }

  return (
    <UnconditionalLoginWarning header={header} description={description} />
  );
}

export function UnconditionalLoginWarning({
  header,
  description,
}: {
  header: string;
  description: string;
}) {
  return (
    <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <CardContent>
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="font-medium text-amber-900 dark:text-amber-100">
              <LoginLink asText />, {header}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
