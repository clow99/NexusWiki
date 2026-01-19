"use client";

import MDEditor from "@uiw/react-md-editor";

type MarkdownEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
};

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? "")}
        preview="edit"
        height={420}
      />
    </div>
  );
}
