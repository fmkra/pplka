"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import {
  clearCategoryQuestions,
  clearLicenseQuestions,
  getCachedLicenseMeta,
  saveCategoryQuestionsPage,
  saveLicenseMeta,
} from "./questions-cache";

type LicenseVersionRow = {
  id: number;
  version: number;
};

function parseLicenseVersions(input: unknown): LicenseVersionRow[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((row) => {
    if (typeof row !== "object" || row === null) return [];
    const record = row as { id?: unknown; version?: unknown };
    const id = record.id;
    const version = record.version;
    if (typeof id !== "number" || typeof version !== "number") return [];
    return [{ id, version }];
  });
}

export function useOfflineQuestions() {
  const utils = api.useUtils();
  const [licenseStatus, setLicenseStatus] = useState<
    Record<number, number | boolean>
  >({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDownloadStatus = async () => {
      const licensesData = await utils.questionDatabase.getLicenses.fetch();
      const licenses = parseLicenseVersions(licensesData);
      const statuses = await Promise.all(
        licenses.map(async (license) => {
          const cachedMeta = await getCachedLicenseMeta(license.id);
          return [license.id, cachedMeta !== undefined] as const;
        }),
      );
      if (cancelled) return;
      setLicenseStatus(Object.fromEntries(statuses));
      setIsHydrated(true);
    };

    void loadDownloadStatus();
    return () => {
      cancelled = true;
    };
  }, [utils]);

  async function downloadLicense(licenseId: number) {
    const categories = await utils.download.getCategories.fetch({
      licenseId,
    });
    const licensesData = await utils.questionDatabase.getLicenses.fetch();
    const licenses = parseLicenseVersions(licensesData);
    const licenseVersion = licenses.find((license) => license.id === licenseId);

    await clearLicenseQuestions(licenseId);
    setLicenseStatus((state) => ({
      ...state,
      [licenseId]: 0,
    }));
    // TODO: IMPORTANT: error handling
    let i = 0;
    for (const category of categories) {
      await downloadCategory(licenseId, category.id);
      const progress = Math.round((100 * ++i) / categories.length);
      setLicenseStatus((state) => ({
        ...state,
        [licenseId]: progress,
      }));
    }
    await saveLicenseMeta({
      licenseId,
      categoryIds: categories.map((category) => category.id),
      downloadedAt: new Date().toISOString(),
      version: licenseVersion?.version ?? 1,
    });
    setLicenseStatus((state) => ({
      ...state,
      [licenseId]: true,
    }));
  }

  const LIMIT = 100;

  async function downloadCategory(licenseId: number, categoryId: number) {
    await clearCategoryQuestions(licenseId, categoryId);
    let offset = 0;
    let page;
    do {
      page = await utils.download.getQuestions.fetch({
        categoryId,
        limit: LIMIT,
        offset,
      });
      await saveCategoryQuestionsPage(licenseId, categoryId, page);
      offset += LIMIT;
    } while (page.length === LIMIT);
  }

  function isLicenseDownloaded(
    licenseId: number,
  ): number | boolean | undefined {
    return licenseStatus[licenseId];
  }

  async function clearLicense(licenseId: number) {
    await clearLicenseQuestions(licenseId);
    setLicenseStatus((state) => ({
      ...state,
      [licenseId]: false,
    }));
  }

  return {
    downloadLicense,
    clearLicense,
    isLicenseDownloaded,
    isHydrated: () => isHydrated,
  };
}
