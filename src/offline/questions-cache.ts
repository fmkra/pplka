"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

type DownloadQuestionEntry =
  inferRouterOutputs<AppRouter>["download"]["getQuestions"][number];

const DB_NAME = "pplka-offline";
const DB_VERSION = 1;

export type CachedQuestionEntry = {
  questionInstanceId: string;
  licenseId: number;
  categoryId: number;
  question: DownloadQuestionEntry["question"];
  hasExplanation: boolean;
};

export type CachedLicenseMeta = {
  licenseId: number;
  categoryIds: number[];
  downloadedAt: string;
  version: number;
};

interface OfflineQuestionsDbSchema extends DBSchema {
  questions: {
    key: string;
    value: CachedQuestionEntry;
    indexes: {
      "by-license": number;
      "by-license-category": [number, number];
    };
  };
  licenses: {
    key: number;
    value: CachedLicenseMeta;
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineQuestionsDbSchema>> | null = null;

function getDb() {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return null;
  }
  if (dbPromise) return dbPromise;
  dbPromise = openDB<OfflineQuestionsDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("questions")) {
        const questionsStore = db.createObjectStore("questions", {
          keyPath: "questionInstanceId",
        });
        questionsStore.createIndex("by-license", "licenseId");
        questionsStore.createIndex("by-license-category", [
          "licenseId",
          "categoryId",
        ]);
      }
      if (!db.objectStoreNames.contains("licenses")) {
        db.createObjectStore("licenses", {
          keyPath: "licenseId",
        });
      }
    },
  });
  return dbPromise;
}

export async function clearLicenseQuestions(licenseId: number) {
  const db = await getDb();
  if (!db) return;
  const tx = db.transaction(["questions", "licenses"], "readwrite");
  const questionsStore = tx.objectStore("questions");
  const keys = await questionsStore.index("by-license").getAllKeys(licenseId);
  await Promise.all(keys.map((key) => questionsStore.delete(key)));
  await tx.objectStore("licenses").delete(licenseId);
  await tx.done;
}

export async function clearCategoryQuestions(licenseId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return;
  const tx = db.transaction("questions", "readwrite");
  const questionsStore = tx.objectStore("questions");
  const existingKeys = await questionsStore
    .index("by-license-category")
    .getAllKeys([licenseId, categoryId]);
  await Promise.all(existingKeys.map((key) => questionsStore.delete(key)));
  await tx.done;
}

export async function saveCategoryQuestionsPage(
  licenseId: number,
  categoryId: number,
  entries: DownloadQuestionEntry[],
) {
  const db = await getDb();
  if (!db) return;
  const tx = db.transaction("questions", "readwrite");
  const questionsStore = tx.objectStore("questions");
  await Promise.all(
    entries.map((entry) =>
      questionsStore.put({
        questionInstanceId: entry.questionInstance.id,
        licenseId,
        categoryId,
        question: entry.question,
        hasExplanation: entry.hasExplanation,
      }),
    ),
  );
  await tx.done;
}

export async function saveLicenseMeta(meta: CachedLicenseMeta) {
  const db = await getDb();
  if (!db) return;
  await db.put("licenses", meta);
}

export async function getCachedLicenseMeta(licenseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return db.get("licenses", licenseId);
}

export async function getCachedLicenseQuestions(
  licenseId: number,
): Promise<CachedQuestionEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db.getAllFromIndex("questions", "by-license", licenseId);
}
