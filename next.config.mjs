import { createMDX } from "fumadocs-mdx/next";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
const version = packageJson.version;

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_COMMIT_HASH: process.env.SOURCE_COMMIT ?? process.env.GIT_SHA ?? "unknown",
  },
  // Temporarily disable Turbopack to debug fumadocs-mdx
  // turbopack: {},
};

const withMDX = createMDX();

export default withMDX(config);
