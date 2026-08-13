"use client";

import {
  catalogManifestSchema,
  knowledgeBaseCatalogSchema,
  questionCatalogSchema,
  type CatalogManifest,
} from "./catalog-schema";
import {
  installKnowledgeBaseCatalog,
  installQuestionCatalog,
} from "./catalog-db";

export const KNOWLEDGE_BASE_ASSET_CACHE = "pplka-knowledge-base-assets";

async function fetchManifest(): Promise<CatalogManifest> {
  const response = await fetch("/offline/catalogs/manifest.json", {
    cache: "no-cache",
  });
  if (!response.ok) throw new Error("Nie udało się pobrać manifestu offline.");
  return catalogManifestSchema.parse(await response.json());
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function fetchVerifiedJson(url: string, expectedHash: string) {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error("Nie udało się pobrać pakietu offline.");
  const body = await response.text();
  if ((await sha256(body)) !== expectedHash) {
    throw new Error("Pobrany pakiet offline jest uszkodzony.");
  }
  return JSON.parse(body) as unknown;
}

export async function downloadQuestionCatalog(
  licenseUrl: string,
  onProgress?: (progress: number) => void,
) {
  const manifest = await fetchManifest();
  onProgress?.(10);
  const entry = manifest.questions[licenseUrl];
  if (!entry) throw new Error("Brak pakietu pytań dla tej licencji.");
  const catalog = questionCatalogSchema.parse(
    await fetchVerifiedJson(entry.url, entry.sha256),
  );
  onProgress?.(75);
  await installQuestionCatalog(catalog, entry.version);
  onProgress?.(100);
}

async function cacheKnowledgeBaseAssets(
  assetUrls: string[],
  onProgress?: (completed: number, total: number) => void,
) {
  if (!("caches" in window)) return;
  const cache = await caches.open(KNOWLEDGE_BASE_ASSET_CACHE);
  for (let index = 0; index < assetUrls.length; index++) {
    const url = assetUrls[index]!;
    const existing = await cache.match(url);
    if (!existing) {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) {
        throw new Error("Nie udało się pobrać ilustracji bazy wiedzy.");
      }
      await cache.put(url, response);
    }
    onProgress?.(index + 1, assetUrls.length);
  }
}

async function pruneKnowledgeBaseAssets(assetUrls: string[]) {
  if (!("caches" in window)) return;
  const cache = await caches.open(KNOWLEDGE_BASE_ASSET_CACHE);
  const wanted = new Set(
    assetUrls.map((url) => new URL(url, location.href).href),
  );
  for (const request of await cache.keys()) {
    if (!wanted.has(request.url)) await cache.delete(request);
  }
}

export async function downloadKnowledgeBaseCatalog(
  onProgress?: (progress: number) => void,
) {
  const manifest = await fetchManifest();
  onProgress?.(5);
  const entry = manifest.knowledgeBase;
  const catalog = knowledgeBaseCatalogSchema.parse(
    await fetchVerifiedJson(entry.url, entry.sha256),
  );
  onProgress?.(35);
  await cacheKnowledgeBaseAssets(catalog.a, (completed, total) => {
    onProgress?.(35 + Math.round((completed / Math.max(total, 1)) * 50));
  });
  onProgress?.(90);
  await installKnowledgeBaseCatalog(catalog, entry.version);
  await pruneKnowledgeBaseAssets(catalog.a);
  onProgress?.(100);
}
