import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import React from "react";

function insertBreakOpportunities(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : null;
    const nextChar = i < text.length - 1 ? text[i + 1] : null;

    result.push(char);

    if (char === "." && prevChar !== "." && nextChar !== ".") {
      result.push(<wbr key={key++} />);
    } else if (char === "/") {
      result.push(<wbr key={key++} />);
    }
  }

  return result;
}

function processInlineCodeChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") {
    return insertBreakOpportunities(children);
  }
  return children;
}

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
  const { src, alt, title } = props;
  const caption = title || alt;

  const renderImage = () => {
    // Handle StaticImageData objects (Next.js image imports)
    if (isStaticImageData(src)) {
      const isAnimated = src.src.toLowerCase().endsWith(".gif");
      return (
        <ImageZoom>
          <Image
            src={src.src}
            alt={alt || ""}
            width={src.width}
            height={src.height}
            placeholder={src.blurDataURL ? "blur" : "empty"}
            blurDataURL={src.blurDataURL}
            unoptimized={isAnimated}
            className="rounded-lg mx-auto block max-w-full h-auto my-0!"
            suppressHydrationWarning
          />
        </ImageZoom>
      );
    }

    // Handle string URLs (including absolute paths like /blog/...)
    const srcString = typeof src === "string" ? src : String(src);
    const isAnimated = srcString.toLowerCase().endsWith(".gif");
    return (
      <ImageZoom>
        <Image
          src={srcString}
          alt={alt || ""}
          width={800}
          height={450}
          unoptimized={isAnimated}
          className="rounded-lg mx-auto block max-w-full h-auto my-0!"
        />
      </ImageZoom>
    );
  };

  return (
    <span
      style={{
        display: "block",
        textAlign: "center",
        width: "100%",
        marginTop: "2rem",
        marginBottom: "2rem",
      }}
    >
      {renderImage()}
      {caption && (
        <span
          style={{
            display: "block",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "#71717a",
            marginTop: "0.5rem",
          }}
          className="dark:text-zinc-400"
        >
          {caption}
        </span>
      )}
    </span>
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
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code
          className="bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 rounded px-1.5 py-0.5 text-sm font-mono font-medium text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap"
          {...props}
        >
          {processInlineCodeChildren(children)}
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
