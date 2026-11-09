import { z } from "zod";

import { formatDateValue, getPublicationDate } from "../lib/publication-date";

/**
 * Frontmatter of `blog/<slug>/<lang>.mdx`.
 *
 * `date` is either `YYYY-MM-DD` (released at site-local midnight) or a quoted ISO
 * timestamp with an explicit offset (released at that instant). YAML parsers that turn
 * bare dates into `Date` objects are normalized back to the date-only form.
 */
export const postSchema = z.object({
  title: z.string(),
  date: z.preprocess(
    formatDateValue,
    z
      .string()
      .refine(
        (value) => Number.isFinite(getPublicationDate(value).getTime()),
        "Use YYYY-MM-DD or a quoted ISO timestamp with an explicit timezone",
      ),
  ),
  excerpt: z.string(),
  tags: z.array(z.string()),
});

export type PostFrontmatter = z.infer<typeof postSchema>;
