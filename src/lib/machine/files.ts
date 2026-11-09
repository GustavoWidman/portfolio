import { HOSTS, LANGUAGES } from "../config";
import { getEpochs, getPosts, rawSource } from "../posts";
import { releasedBySlug, servedPost, servedPosts } from "../release";
import { treeFiles } from "../urls";
import { consoleData } from "./console";
import { curlCard } from "./curl";
import { rssXml, sitemapXml } from "./feeds";
import { blogIndexMarkdown, llmsFull, llmsTxt, postMarkdown } from "./llms";
import type { HostKind, Language } from "../config";
import type { Epoch } from "../epochs";

/**
 * Non-HTML files of every `site/<epoch>/<host>/<lang>/` tree (see `treeFiles` for names):
 * sitemap, RSS feed, llms.txt, llms-full.txt, the blog index and per-post markdown, the
 * curl card, and the serial console's data. Every file only lists posts released in its epoch, and per-post markdown
 * is the version the tree's HTML page shows (`servedPost()`).
 */
export type MachineFile =
  | { kind: "sitemap" | "feed" | "llms" | "llms-full" | "blog-markdown" | "curl" | "console" }
  | { kind: "post-markdown"; slug: string };

export interface MachineRoute {
  params: { epoch: string; host: HostKind; lang: Language; file: string };
  props: { epoch: Epoch; host: HostKind; lang: Language; file: MachineFile };
}

export async function machineRoutes(): Promise<MachineRoute[]> {
  const posts = await getPosts();
  const routes: MachineRoute[] = [];
  for (const epoch of await getEpochs()) {
    const slugs = releasedBySlug(posts, epoch).map((post) => post.slug);
    for (const host of HOSTS) {
      for (const lang of LANGUAGES) {
        const files: [string, MachineFile][] = [
          [treeFiles.sitemap, { kind: "sitemap" }],
          [treeFiles.feed(host), { kind: "feed" }],
          [treeFiles.llms, { kind: "llms" }],
          [treeFiles.llmsFull, { kind: "llms-full" }],
          [treeFiles.blogMarkdown, { kind: "blog-markdown" }],
          [treeFiles.curl, { kind: "curl" }],
          [treeFiles.console, { kind: "console" }],
          ...slugs.map((slug): [string, MachineFile] => [
            treeFiles.postMarkdown(slug),
            { kind: "post-markdown", slug },
          ]),
        ];
        for (const [file, spec] of files) {
          routes.push({
            params: { epoch: epoch.name, host, lang, file },
            props: { epoch, host, lang, file: spec },
          });
        }
      }
    }
  }
  return routes;
}

const TYPES = {
  xml: "application/xml; charset=utf-8",
  rss: "application/rss+xml; charset=utf-8",
  markdown: "text/markdown; charset=utf-8",
  text: "text/plain; charset=utf-8",
  json: "application/json; charset=utf-8",
} as const;

export async function renderMachineFile(
  props: MachineRoute["props"],
): Promise<{ body: string; contentType: string }> {
  const { epoch, host, lang, file } = props;
  const posts = await getPosts();
  const bySlug = releasedBySlug(posts, epoch);
  switch (file.kind) {
    case "sitemap":
      return { body: sitemapXml(bySlug, epoch), contentType: TYPES.xml };
    case "feed":
      return {
        body: rssXml(servedPosts(posts, epoch, lang), epoch, lang),
        contentType: TYPES.rss,
      };
    case "llms":
      return { body: llmsTxt(bySlug), contentType: TYPES.text };
    case "llms-full":
      return {
        body: llmsFull(
          bySlug.map((post) => ({ post, raw: rawSource(post) })),
          epoch,
        ),
        contentType: TYPES.text,
      };
    case "blog-markdown":
      return { body: blogIndexMarkdown(bySlug, epoch), contentType: TYPES.markdown };
    case "curl":
      return { body: curlCard(servedPosts(posts, epoch, lang), lang), contentType: TYPES.text };
    case "console":
      return {
        body: JSON.stringify(consoleData(posts, epoch, host, lang)),
        contentType: TYPES.json,
      };
    case "post-markdown": {
      const post = servedPost(posts, epoch, lang, file.slug);
      if (!post) throw new Error(`No released version of ${file.slug} in ${epoch.name}`);
      return { body: postMarkdown(post, rawSource(post)), contentType: TYPES.markdown };
    }
  }
}
