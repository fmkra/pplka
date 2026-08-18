import type { Metadata } from "next";
import Link from "next/link";
import { HardDriveDownload, Home, WifiOff } from "lucide-react";
import Main from "~/app/_components/main";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { OFFLINE_DOWNLOADS } from "~/app/links";

export const metadata: Metadata = {
  title: "Brak połączenia",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Main className="flex items-center justify-center py-12">
      <Card className="w-full max-w-xl text-center">
        <CardHeader className="items-center">
          <div className="bg-muted mb-3 flex size-14 items-center justify-center rounded-full">
            <WifiOff className="text-muted-foreground size-7" />
          </div>
          <CardTitle className="text-2xl">Nie masz teraz połączenia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-muted-foreground space-y-2">
            <p>
              Ta strona nie została zapisana na urządzeniu i nie może zostać
              otwarta bez internetu.
            </p>
            <p>
              Nadal możesz korzystać z wcześniej pobranych pytań, bazy wiedzy
              oraz stron startowych licencji.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link href={`/${OFFLINE_DOWNLOADS}`} prefetch={false}>
                <HardDriveDownload className="size-4" />
                Pobrane materiały
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/ppla" prefetch={false}>
                <Home className="size-4" />
                Przejdź do strony startowej
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Po odzyskaniu połączenia odśwież stronę, aby spróbować ponownie.
          </p>
        </CardContent>
      </Card>
    </Main>
  );
}
