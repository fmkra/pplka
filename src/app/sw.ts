/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, Serwist } from "serwist";

const knowledgeBaseAssets = {
  matcher: ({ url }: { url: URL }) =>
    url.hostname === "raw.githubusercontent.com" &&
    url.pathname.startsWith("/fmkra/pplka-explanations/") &&
    url.pathname.endsWith(".svg"),
  handler: new CacheFirst({
    cacheName: "pplka-knowledge-base-assets",
  }),
};

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [knowledgeBaseAssets, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/baza-wiedzy",
        matcher({ request }) {
          return (
            request.destination === "document" &&
            new URL(request.url).pathname.startsWith("/baza-wiedzy")
          );
        },
      },
      ...["ppla", "pplh", "spl", "bpl"].map((license) => ({
        url: `/${license}/baza-pytan`,
        matcher({ request }: { request: Request }) {
          return (
            request.destination === "document" &&
            new URL(request.url).pathname.startsWith(`/${license}/baza-pytan`)
          );
        },
      })),
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
