import { execFileSync } from "node:child_process";

import pkg from "../../package.json";
import { SITE_TIMEZONE } from "./config";
import { buildTime } from "./epochs";

/** Facts about the build shown on the site. None of them comes from the wall clock. */
export interface BuildInfo {
  /** `version` of package.json. */
  version: string;
  /** Short id of the commit the build is based on; absent when no VCS or override exists. */
  commit: string | undefined;
  /** `YYYY-MM-DD` of the build reference time in the site timezone. */
  date: string;
}

const COMMIT_ID = /^[0-9a-f]{7,40}$/;

function vcsCommit(): string | undefined {
  const attempts: [string, string[]][] = [
    ["jj", ["log", "-r", "@-", "--no-graph", "--ignore-working-copy", "-T", 'commit_id ++ "\\n"']],
    ["git", ["rev-parse", "HEAD"]],
  ];
  for (const [cmd, args] of attempts) {
    try {
      const out = execFileSync(cmd, args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      // A merge working copy has several parents; the first one names the build.
      const id = out.split("\n")[0]?.trim() ?? "";
      if (COMMIT_ID.test(id)) return id;
    } catch {
      // Tool missing or not a repository; try the next one.
    }
  }
  return undefined;
}

let cached: BuildInfo | undefined;

/**
 * Version, commit and date of the build. The commit is `PORTFOLIO_COMMIT` when set (builds
 * without a repository, such as Nix), else the parent commit from jj (`@-`), then git `HEAD`.
 */
export function buildInfo(): BuildInfo {
  if (cached) return cached;
  const env = process.env.PORTFOLIO_COMMIT?.trim().toLowerCase();
  if (env && !COMMIT_ID.test(env)) {
    throw new Error(`PORTFOLIO_COMMIT must be a hexadecimal commit id, got "${env}"`);
  }
  cached = {
    version: pkg.version,
    commit: (env || vcsCommit())?.slice(0, 7),
    date: new Date(buildTime() * 1000).toLocaleDateString("en-CA", { timeZone: SITE_TIMEZONE }),
  };
  return cached;
}
