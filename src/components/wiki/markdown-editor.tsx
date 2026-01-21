"use client";

import MDEditor from "@uiw/react-md-editor";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";

type MarkdownEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
};

const isS3Url = (value: string) => value.includes("amazonaws.com");
const sizeTitlePattern = /^\s*(\d+)\s*x?\s*(\d+)?\s*$/;

const parseImageTitle = (title?: string | null) => {
  if (!title) {
    return { width: undefined, height: undefined, title: undefined };
  }
  const match = title.match(sizeTitlePattern);
  if (!match) {
    return { width: undefined, height: undefined, title };
  }
  const width = Number(match[1]);
  const height = match[2] ? Number(match[2]) : undefined;
  return { width, height, title: undefined };
};

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? "")}
        preview="live"
        height={420}
        previewOptions={{
          className: "prose prose-zinc max-w-none dark:prose-invert",
          remarkPlugins: [remarkGfm, remarkBreaks],
          rehypePlugins: [rehypeHighlight],
          components: {
            img({ src, alt, title, ...props }) {
              if (!src) {
                return null;
              }
              const nextSrc = isS3Url(src)
                ? `/api/uploads?source=${encodeURIComponent(src)}`
                : src;
              const parsed = parseImageTitle(title);
              return (
                <img
                  src={nextSrc}
                  alt={alt ?? ""}
                  title={parsed.title}
                  width={parsed.width}
                  height={parsed.height}
                  style={{ maxWidth: "100%", height: parsed.height ? `${parsed.height}px` : "auto" }}
                  {...props}
                />
              );
            },
            a({ href, ...props }) {
              if (!href) {
                return <a {...props} />;
              }
              const nextHref = isS3Url(href)
                ? `/api/uploads?source=${encodeURIComponent(href)}`
                : href;
              return <a href={nextHref} {...props} />;
            },
          },
        }}
      />
    </div>
  );
}
