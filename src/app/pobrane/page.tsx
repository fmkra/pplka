import type { Metadata } from "next";
import Main from "~/app/_components/main";
import { OfflineDownloadManager } from "~/app/_components/offline-download-manager";

export const metadata: Metadata = {
  title: "Pobrane materiały",
  description: "Zarządzaj materiałami zapisanymi do używania bez internetu.",
  robots: { index: false, follow: false },
};

export default function OfflineDownloadsPage() {
  return (
    <Main>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pobrane materiały</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj bazami pytań i materiałami dostępnymi bez połączenia z
            internetem.
          </p>
        </div>
        <OfflineDownloadManager />
      </div>
    </Main>
  );
}
