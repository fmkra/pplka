import { readFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { list, put } from "@vercel/blob";

nextEnv.loadEnvConfig(process.cwd());

const outputDirectory = path.join(
  process.cwd(),
  "public",
  "offline",
  "catalogs",
);
const localManifest = JSON.parse(
  await readFile(path.join(outputDirectory, "manifest.json"), "utf8"),
);
const prefix = (process.env.OFFLINE_CATALOG_PREFIX ?? "development/local")
  .replace(/^\/+|\/+$/g, "")
  .replace(/[^a-zA-Z0-9/_-]/g, "-");

if (!prefix) throw new Error("OFFLINE_CATALOG_PREFIX cannot be empty.");
const blobStoreId = process.env.BLOB_STORE_ID;
const hasReadWriteToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const hasOidcToken = Boolean(process.env.VERCEL_OIDC_TOKEN);

if (!hasReadWriteToken && !hasOidcToken) {
  throw new Error(
    "Blob credentials are missing. Run `vercel env pull .env.local` to obtain VERCEL_OIDC_TOKEN.",
  );
}
if (!hasReadWriteToken && !blobStoreId) {
  throw new Error(
    "VERCEL_OIDC_TOKEN is present, but BLOB_STORE_ID is missing. Connect the Blob store to this project's Development environment and run `vercel env pull .env.local` again.",
  );
}

if (
  prefix === "production" &&
  process.env.OFFLINE_CATALOG_ALLOW_PRODUCTION !== "true"
) {
  throw new Error(
    "Refusing to publish production catalogs. Set OFFLINE_CATALOG_ALLOW_PRODUCTION=true explicitly.",
  );
}

async function listAllBlobs(blobPrefix) {
  const blobs = [];
  let cursor;
  do {
    const result = await list({
      prefix: blobPrefix,
      cursor,
      limit: 1000,
    });
    blobs.push(...result.blobs);
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  return blobs;
}

const existing = new Map(
  (await listAllBlobs(`${prefix}/data/`)).map((blob) => [blob.pathname, blob]),
);

async function publishEntry(entry) {
  const filename = path.posix.basename(entry.url);
  const pathname = `${prefix}/data/${filename}`;
  let blob = existing.get(pathname);
  if (!blob) {
    const body = await readFile(path.join(outputDirectory, "data", filename));
    blob = await put(pathname, body, {
      access: "public",
      contentType: "application/json",
      cacheControlMaxAge: 31536000,
    });
    console.log(`Uploaded ${pathname}`);
  } else {
    console.log(`Unchanged ${pathname}`);
  }
  return { ...entry, url: blob.url };
}

const questions = {};
for (const [licenseUrl, entry] of Object.entries(localManifest.questions)) {
  questions[licenseUrl] = await publishEntry(entry);
}
const knowledgeBase = await publishEntry(localManifest.knowledgeBase);
const remoteManifest = {
  ...localManifest,
  questions,
  knowledgeBase,
};
const manifestPathname = `${prefix}/manifest.json`;
const manifestBlob = await put(
  manifestPathname,
  JSON.stringify(remoteManifest),
  {
    access: "public",
    contentType: "application/json",
    cacheControlMaxAge: 60,
    allowOverwrite: true,
  },
);

console.log(`Published manifest: ${manifestBlob.url}`);
console.log(
  `Set NEXT_PUBLIC_OFFLINE_CATALOG_MANIFEST_URL=${manifestBlob.url} to use it.`,
);
