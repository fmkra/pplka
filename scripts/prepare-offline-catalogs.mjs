import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

if (process.env.NEXT_PUBLIC_OFFLINE_CATALOG_MANIFEST_URL) {
  console.log("Using the externally published offline catalog manifest.");
} else {
  console.log(
    "No external catalog manifest configured; generating local assets.",
  );
  await import("./generate-offline-catalogs.mjs");
}
