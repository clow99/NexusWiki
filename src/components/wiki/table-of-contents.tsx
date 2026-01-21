"use client";

import { useMemo } from "react";
import { List } from "lucide-react";

type TableOfContentsProps = {
  content: string;
};

type Heading = {
  id: string;
  text: string;
  level: number;
};

export function TableOfContents({ content }: TableOfContentsProps) {
  const headings = useMemo(() => {
    const lines = content.split("\n");
    const result: Heading[] = [];

    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        // Create a URL-friendly id from the heading text
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        result.push({ id, text, level });
      }
    }

    return result;
  }, [content]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <List className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">On this page</span>
      </div>
      <nav className="space-y-1">
        {headings.map((heading, index) => (
          <a
            key={`${heading.id}-${index}`}
            href={`#${heading.id}`}
            className={`
              block text-sm text-muted-foreground hover:text-foreground transition-colors
              ${heading.level === 1 ? "pl-0 font-medium" : ""}
              ${heading.level === 2 ? "pl-3" : ""}
              ${heading.level === 3 ? "pl-6 text-xs" : ""}
            `}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
