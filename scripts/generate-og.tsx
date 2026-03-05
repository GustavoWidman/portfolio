import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import matter from "gray-matter";

const cyan = "\x1b[36m";
const green = "\x1b[32m";
const magenta = "\x1b[35m";
const bold = "\x1b[1m";
const italic = "\x1b[3m";
const dim = "\x1b[2m";
const reset = "\x1b[0m";

function logHeader() {
  console.log(`\n${bold}${cyan}generate-og.tsx${reset}\n`);
}

type OGTask =
  | { type: "portfolio"; lang: "en" | "pt"; outDir: string; taskId: string }
  | { type: "blogIndex"; lang: "en" | "pt"; outDir: string; taskId: string }
  | {
      type: "blogPost";
      slug: string;
      lang: "en" | "pt";
      title: string;
      date: string;
      tags: string[];
      outDir: string;
      taskId: string;
    };

interface WorkerResult {
  taskId: string;
  name: string;
  duration: number;
}

type BunWorker = {
  postMessage(data: unknown): void;
  onmessage: ((e: { data: unknown }) => void) | null;
  terminate(): void;
};

class WorkerPool {
  private workers: BunWorker[] = [];
  private readyWorkers: Set<number> = new Set();
  private pendingResults = new Map<string, (result: WorkerResult) => void>();
  private taskQueue: OGTask[] = [];

  constructor(private numWorkers: number, private workerPath: string) {}

  async start(): Promise<void> {
    const readyPromises: Promise<void>[] = [];

    for (let i = 0; i < this.numWorkers; i++) {
      const worker = new Worker(this.workerPath) as BunWorker;
      this.workers.push(worker);

      let readyResolve: () => void;
      const readyPromise = new Promise<void>((resolve) => {
        readyResolve = resolve;
      });

      worker.onmessage = (e: { data: unknown }) => {
        const msg = e.data as WorkerResult | { type: string };
        if ("type" in msg && msg.type === "ready") {
          this.readyWorkers.add(i);
          readyResolve!();
        } else if ("taskId" in msg) {
          const resolve = this.pendingResults.get(msg.taskId);
          if (resolve) {
            resolve(msg);
            this.pendingResults.delete(msg.taskId);
          }
          this.readyWorkers.add(i);
          this.processQueue();
        }
      };

      readyPromises.push(readyPromise);
    }

    await Promise.all(readyPromises);
  }

  submitTask(task: OGTask): Promise<WorkerResult> {
    const promise = new Promise<WorkerResult>((resolve) => {
      this.pendingResults.set(task.taskId, resolve);
    });

    this.taskQueue.push(task);
    this.processQueue();

    return promise;
  }

  private processQueue() {
    while (this.taskQueue.length > 0 && this.readyWorkers.size > 0) {
      const task = this.taskQueue.shift()!;
      const workerIdx = [...this.readyWorkers][0];

      this.readyWorkers.delete(workerIdx);
      this.workers[workerIdx].postMessage(task);
    }
  }

  shutdown(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}

async function main() {
  const totalStart = Date.now();
  const outDir = path.resolve("public/og");
  await fs.mkdir(outDir, { recursive: true });

  const existing = await fs.readdir(outDir);
  for (const file of existing) {
    if (file.endsWith(".png")) {
      await fs.unlink(path.join(outDir, file));
    }
  }

  const numWorkers = os.cpus().length;
  const pool = new WorkerPool(numWorkers, path.resolve("scripts/generate-og-worker.tsx"));

  await pool.start();

  const tasks: OGTask[] = [];

  for (const lang of ["en", "pt"] as const) {
    const taskId = `portfolio-${lang}`;
    tasks.push({ type: "portfolio", lang, outDir, taskId });
  }

  for (const lang of ["en", "pt"] as const) {
    const taskId = `blogIndex-${lang}`;
    tasks.push({ type: "blogIndex", lang, outDir, taskId });
  }

  const contentDir = path.resolve("blog");
  const slugDirs = await fs.readdir(contentDir, { withFileTypes: true });

  for (const dir of slugDirs) {
    if (!dir.isDirectory()) continue;
    const slug = dir.name;
    const slugDir = path.join(contentDir, slug);
    const files = await fs.readdir(slugDir);

    for (const file of files) {
      if (!file.endsWith(".mdx") && !file.endsWith(".md")) continue;
      const lang = file.replace(/\.mdx?$/, "");
      if (lang !== "en" && lang !== "pt") continue;

      const content = await fs.readFile(path.join(slugDir, file), "utf-8");
      const { data } = matter(content);

      const taskId = `blogPost-${slug}-${lang}`;
      tasks.push({
        type: "blogPost",
        slug,
        lang: lang as "en" | "pt",
        title: data.title || "Blog Post",
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        outDir,
        taskId,
      });
    }
  }

  logHeader();

  let completed = 0;
  const total = tasks.length;

  await Promise.all(
    tasks.map(async (task) => {
      const result = await pool.submitTask(task);
      completed++;
      const timing = result.duration < 1000 ? `${result.duration}ms` : `${(result.duration / 1000).toFixed(1)}s`;
      console.log(
        `  ${green}✓${reset} ${italic}${magenta}${result.name}${reset} ${bold}(${timing})${reset} ${dim}[${completed}/${total}]${reset}`,
      );
    }),
  );

  pool.shutdown();

  const totalDuration = Date.now() - totalStart;
  const totalTiming = totalDuration < 1000 ? `${totalDuration}ms` : `${(totalDuration / 1000).toFixed(1)}s`;
  console.log(`\n${bold}${green}✓${reset} Generated all OG images in ${bold}${totalTiming}${reset}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
