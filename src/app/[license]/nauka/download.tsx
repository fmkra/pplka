"use client";

import { Button } from "~/components/ui/button";
import { useHydrated } from "~/lib/use-hydrated";
import { useOfflineQuestions } from "~/offline/questions";

export function DownloadComponent({ licenseId }: { licenseId: number }) {
  const offline = useOfflineQuestions();
  const isHydrated = useHydrated();

  // TODO: make this component look nice and let user know that when it's downloading, they shouldn't navigate away from the page

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
