import "server-only";

import { unstable_cache } from "next/cache";
import { db } from "~/server/db";

export const getLicenses = unstable_cache(async () => {
  return await db.query.licenses.findMany({
    orderBy: (license, { asc }) => [asc(license.id)],
  });
});

export const getLicense = (licenseUrl: string) =>
  getLicenses().then((licenses) =>
    licenses.find((license) => license.url === licenseUrl),
  );

export const getCategories = unstable_cache(async () => {
  return await db.query.categories.findMany({
    orderBy: (category, { asc }) => [asc(category.id)],
  });
});

export const getLicenseCategories = (licenseId: number) => {
  return getCategories().then((categories) =>
    categories.filter((category) => category.licenseId === licenseId),
  );
};

export const getCategoryByUrl = (licenseId: number, categoryUrl: string) => {
  return getCategories().then((categories) =>
    categories.find(
      (category) =>
        category.url === categoryUrl && category.licenseId === licenseId,
    ),
  );
};

export const getCategoryById = (categoryId: number) => {
  return getCategories().then((categories) =>
    categories.find((category) => category.id === categoryId),
  );
};
