"use client";

import { useOfflineStore } from "~/stores";
import type { CategoryData } from "~/stores/offine-store";
import { api } from "~/trpc/react";

export function useOfflineQuestions() {
  const utils = api.useUtils();
  const offlineStore = useOfflineStore();

  async function downloadLicense(licenseId: number) {
    const categories = await utils.download.getCategories.fetch({
      licenseId,
    });
    offlineStore.removeLicense(licenseId);
    offlineStore.updateLicenseProgress(licenseId, 0, categories.length);
    // TODO: IMPORTANT: error handling
    let i = 0;
    for (const category of categories) {
      await downloadCategory(category.id, category);
      offlineStore.updateLicenseProgress(licenseId, ++i, categories.length);
    }
    offlineStore.saveLicense(
      licenseId,
      categories.map((category) => category.id),
    );
  }

  const LIMIT = 100;

  async function downloadCategory(categoryId: number, category: CategoryData) {
    offlineStore.removeCategoryQuestions(categoryId);
    let offset = 0;
    let page;
    do {
      page = await utils.download.getQuestions.fetch({
        categoryId,
        limit: LIMIT,
        offset,
      });
      offlineStore.saveCategoryQuestions(categoryId, category, page);
      offset += LIMIT;
    } while (page.length === LIMIT);
  }

  function isLicenseDownloaded(licenseId: number): number | boolean {
    return offlineStore.getLicenseProgress(licenseId);
  }

  return {
    downloadLicense,
    isLicenseDownloaded,
    isHydrated: offlineStore.isHydrated,
  };
}
