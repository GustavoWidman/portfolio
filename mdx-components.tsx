import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";

// Type for Next.js static image imports
interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
}

// Helper to check if src is a StaticImageData object
function isStaticImageData(src: unknown): src is StaticImageData {
  return (
    typeof src === "object" &&
    src !== null &&
    "src" in src &&
    typeof (src as StaticImageData).src === "string"
  );
}

// Override the img component to handle both string URLs and StaticImageData
function CustomImage(props: React.ComponentProps<"img">) {
  const { src, alt, ...rest } = props;

  // Handle StaticImageData objects (Next.js image imports)
  if (isStaticImageData(src)) {
    return (
      <ImageZoom>
        <Image
          src={src.src}
          alt={alt || ""}
          width={src.width}
          height={src.height}
          placeholder={src.blurDataURL ? "blur" : "empty"}
          blurDataURL={src.blurDataURL}
          className="rounded-lg"
        />
      </ImageZoom>
    );
  }

  // Handle string URLs (including absolute paths like /blog/...)
  const srcString = typeof src === "string" ? src : String(src);

  return (
    <ImageZoom>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...rest} src={srcString} alt={alt || ""} className="rounded-lg" />
    </ImageZoom>
  );
}

export function getMDXComponents(components: MDXComponents = {}): MDXComponents {
	return {
		...defaultMdxComponents,
		pre: ({ ref: _ref, ...props }) => (
			<CodeBlock keepBackground {...props} className="not-prose">
				<Pre>{props.children}</Pre>
			</CodeBlock>
		),
		// Override inline code to match old Vite styling (emerald text, no backticks)
		code: ({ children, className, ...props }) => {
			// If className contains "language-", it's a code block handled by pre above
			if (className?.includes("language-")) {
				return <code className={className} {...props}>{children}</code>;
			}
			return (
				<code
					className="bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 rounded px-1.5 py-0.5 text-sm font-mono font-medium text-emerald-600 dark:text-emerald-400 break-all whitespace-pre-wrap"
					{...props}
				>
					{children}
				</code>
			);
		},
		// Override img to use ImageZoom for click-to-zoom functionality
		img: CustomImage,
		...components,
	};
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return getMDXComponents(components);
}
