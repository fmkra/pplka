/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import {withSerwist} from "@serwist/turbopack";
import { spawnSync } from "node:child_process";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// const exportedConfig = process.env.NODE_ENV === "production" ? 
// withSerwistInit({
//   cacheOnNavigation: true,
//   swSrc: "src/app/sw.ts",
//   swDest: "public/sw.js",
//   additionalPrecacheEntries: [{
//     url: "/~offline",
//     // Using `git rev-parse HEAD` might not the most efficient
//     // way of determining a revision. You may prefer to use
//     // the hashes of every extra file you precache.
//     revision: spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout ?? crypto.randomUUID()
//   }],

// })(nextConfig) : nextConfig;

const config = withSerwist(nextConfig);

export default config;
