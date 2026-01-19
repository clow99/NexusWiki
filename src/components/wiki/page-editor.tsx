"use client";

import { useState } from "react";

import { MarkdownEditor } from "@/components/wiki/markdown-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PageEditorProps = {
  pageId: string;
  initialTitle: string;
  initialContent: string;
  onSubmitAction: (formData: FormData) => void | Promise<void>;
};

export function PageEditor({
  pageId,
  initialTitle,
  initialContent,
  onSubmitAction,
}: PageEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  return (
    <form action={onSubmitAction} className="space-y-6">
      <input type="hidden" name="pageId" value={pageId} />
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="title">
          Title
        </label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Page title"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Content</label>
        <MarkdownEditor value={content} onChange={setContent} />
        <input type="hidden" name="content" value={content} />
      </div>
      <Button type="submit">Save changes</Button>
    </form>
  );
}
