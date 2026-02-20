import { createMDX } from "fumadocs-mdx/next";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
const version = packageJson.version;

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "standalone",
  skipTrailingSlashRedirect: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_COMMIT_HASH: process.env.SOURCE_COMMIT ?? process.env.GIT_SHA ?? "unknown",
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "react-icons/fa6",
      "react-icons/si",
      "react-icons/tb",
      "react-icons/ri",
      "fumadocs-ui",
      "fumadocs-core",
      "fumadocs-mdx",
    ],
  },
};

const withMDX = createMDX();

export default withMDX(config);
