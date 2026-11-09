import { defineCollection } from "astro:content";

import { blogLoader } from "./content/loader";
import { postSchema } from "./content/schema";

const blog = defineCollection({
  loader: blogLoader(),
  schema: postSchema,
});

export const collections = { blog };
