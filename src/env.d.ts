/// <reference types="astro/client" />

declare module "virtual:post-images" {
  /** Image metadata of every image referenced by a post, keyed by project-relative path. */
  const images: Record<string, import("astro").ImageMetadata>;
  /** URL of the lossless animated WebP of a referenced GIF, when smaller, keyed by project-relative path. */
  export const animatedWebp: Record<string, string | undefined>;
  export default images;
}

declare module "wawoff2" {
  /** WOFF2 to OpenType. */
  export function decompress(woff2: Uint8Array): Promise<Uint8Array>;
  /** OpenType to WOFF2. */
  export function compress(font: Uint8Array): Promise<Uint8Array>;
}

declare module "harfbuzzjs" {
  interface Face {
    collectUnicodes(): Uint32Array;
    destroy(): void;
  }
  interface HarfBuzz {
    createBlob(data: Uint8Array): unknown;
    createFace(blob: unknown, index: number): Face;
  }
  const harfbuzz: Promise<HarfBuzz>;
  export default harfbuzz;
}
