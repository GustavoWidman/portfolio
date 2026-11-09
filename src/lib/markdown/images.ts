import { getImage } from "astro:assets";
import postImages, { animatedWebp } from "virtual:post-images";
import type { Element, ElementContent, Root } from "hast";
import type { ImageMetadata } from "astro";

/**
 * Rendered width of the post column (`blog.css`): 820px beside the table of contents from
 * 1200px up, the frame minus the contents column down to 1024px, a single column of at most
 * 768px with 24px gutters below that, and the full viewport under 720px, where figures bleed
 * to the screen edges.
 */
export const POST_IMAGE_SIZES =
  "(min-width: 1200px) 820px, (min-width: 1024px) calc(100vw - 380px), (min-width: 816px) 768px, (min-width: 721px) calc(100vw - 48px), 100vw";
const WIDTHS = [480, 800, 1200, 1600];
const MAX_WIDTH = 1600;
/**
 * Formats served as-is: SVGs (always `<img>`, never inlined) and GIFs, which also get a
 * lossless animated WebP `<source>` (`virtual:post-images`).
 */
const PASSTHROUGH = new Set(["gif", "svg"]);

const resolved = new Map<string, Promise<Element>>();

function metadataFor(path: string): ImageMetadata {
  const meta = (postImages as Record<string, ImageMetadata | undefined>)[path];
  if (!meta) throw new Error(`Image not found: ${path}`);
  return meta;
}

async function buildImage(path: string, alt: string): Promise<Element> {
  const meta = metadataFor(path);
  const base = {
    alt,
    width: meta.width,
    height: meta.height,
    // WebKit drops the ratio of `width`/`height` for an image that fails to load; the box keeps it.
    style: `aspect-ratio: ${meta.width} / ${meta.height}`,
    decoding: "async",
  };
  if (PASSTHROUGH.has(meta.format)) {
    const img: Element = {
      type: "element",
      tagName: "img",
      properties: { src: meta.src, ...base },
      children: [],
    };
    const webp = animatedWebp[path];
    if (!webp) return img;
    // The GIF stays the <img>: it is what browsers without animated WebP show.
    return {
      type: "element",
      tagName: "picture",
      properties: {},
      children: [
        {
          type: "element",
          tagName: "source",
          properties: { type: "image/webp", srcSet: webp },
          children: [],
        },
        img,
      ],
    };
  }
  const width = Math.min(meta.width, MAX_WIDTH);
  const widths = [...WIDTHS.filter((w) => w < width), width];
  const [avif, webp] = await Promise.all(
    (["avif", "webp"] as const).map((format) =>
      getImage({ src: meta, width, widths, sizes: POST_IMAGE_SIZES, format }),
    ),
  );
  return {
    type: "element",
    tagName: "picture",
    properties: {},
    children: [
      {
        type: "element",
        tagName: "source",
        properties: { type: "image/avif", srcSet: avif.srcSet.attribute, sizes: POST_IMAGE_SIZES },
        children: [],
      },
      {
        type: "element",
        tagName: "img",
        properties: {
          src: webp.src,
          srcSet: webp.srcSet.attribute,
          sizes: POST_IMAGE_SIZES,
          ...base,
        },
        children: [],
      },
    ],
  };
}

function imageElement(path: string, alt: string): Promise<Element> {
  const key = `${path}\0${alt}`;
  let element = resolved.get(key);
  if (!element) {
    element = buildImage(path, alt);
    resolved.set(key, element);
  }
  return element;
}

function findImg(node: Element): Element | undefined {
  if (node.tagName === "img") return node;
  for (const child of node.children) {
    if (child.type === "element") {
      const img = findImg(child);
      if (img) return img;
    }
  }
  return undefined;
}

/**
 * Replaces every `<img data-local-image>` in a rendered body with an optimized image:
 * `<picture>` with AVIF and WebP `srcset`s for raster images, the original file for SVG, and
 * the GIF with its animated WebP. Every image is lazy: a post opens with its title, excerpt
 * and text, so no image is the largest paint, and an eager one would share the link with the
 * page's fonts.
 */
export async function resolveLocalImages(tree: Root): Promise<void> {
  const visit = async (parent: Root | Element): Promise<void> => {
    const children = parent.children as ElementContent[];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.type !== "element") continue;
      const path = child.tagName === "img" ? child.properties.dataLocalImage : undefined;
      if (typeof path === "string") {
        const shared = await imageElement(path, String(child.properties.alt ?? ""));
        const element = structuredClone(shared);
        const img = findImg(element);
        if (img) img.properties.loading = "lazy";
        children[i] = element;
        continue;
      }
      await visit(child);
    }
  };
  await visit(tree);
}
