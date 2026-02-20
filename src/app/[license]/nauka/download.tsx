"use client";

import { Button } from "~/components/ui/button";
import { useHydrated } from "~/lib/use-hydrated";
import { useOfflineQuestions } from "~/offline/questions";

export function DownloadComponent({ licenseId }: { licenseId: number }) {
  const offline = useOfflineQuestions();
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Button onClick={() => offline.downloadLicense(licenseId)}>
        Download
      </Button>
      Download status {JSON.stringify(offline.isLicenseDownloaded(licenseId))}
    </>
  );
}
