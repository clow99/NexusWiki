"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import { MarkdownEditor } from "@/components/wiki/markdown-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PageEditorProps = {
  pageId: string;
  spaceId: string;
  initialTitle: string;
  initialContent: string;
  onSubmitAction: (formData: FormData) => void | Promise<void>;
};

type ParsedImage = {
  alt: string;
  url: string;
  title?: string;
};

const imagePattern = /!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)/g;
const sizeTitlePattern = /^\s*(\d+)\s*x?\s*(\d+)?\s*$/;

const parseImages = (value: string) => {
  const images: ParsedImage[] = [];
  imagePattern.lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = imagePattern.exec(value)) !== null) {
    images.push({
      alt: match[1] ?? "",
      url: match[2] ?? "",
      title: match[3] ?? undefined,
    });
  }

  return images;
};

const parseImageSize = (title?: string) => {
  if (!title) {
    return { width: "", height: "" };
  }
  const match = title.match(sizeTitlePattern);
  if (!match) {
    return { width: "", height: "" };
  }
  return { width: match[1] ?? "", height: match[2] ?? "" };
};

const buildSizeTitle = (width: string, height: string) => {
  const normalizedWidth = width.trim();
  const normalizedHeight = height.trim();

  if (!normalizedWidth && !normalizedHeight) {
    return "";
  }
  if (!normalizedWidth) {
    return "";
  }
  if (!normalizedHeight) {
    return `${normalizedWidth}x`;
  }
  return `${normalizedWidth}x${normalizedHeight}`;
};

const updateImageSize = (value: string, targetIndex: number, width: string, height: string) => {
  const title = buildSizeTitle(width, height);
  imagePattern.lastIndex = 0;
  let match: RegExpExecArray | null = null;
  let currentIndex = 0;

  while ((match = imagePattern.exec(value)) !== null) {
    if (currentIndex === targetIndex) {
      const [full, alt, url] = match;
      const replacement = `![${alt}](${url}${title ? ` "${title}"` : ""})`;
      return `${value.slice(0, match.index)}${replacement}${value.slice(match.index + full.length)}`;
    }
    currentIndex += 1;
  }

  return value;
};

export function PageEditor({
  pageId,
  spaceId,
  initialTitle,
  initialContent,
  onSubmitAction,
}: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState("");
  const [imageWidth, setImageWidth] = useState("");
  const [imageHeight, setImageHeight] = useState("");
  const [imageSizeError, setImageSizeError] = useState<string | null>(null);
  const images = useMemo(() => parseImages(content), [content]);

  useEffect(() => {
    if (images.length === 0) {
      setSelectedImageIndex("");
      setImageWidth("");
      setImageHeight("");
      return;
    }

    if (selectedImageIndex === "" || Number(selectedImageIndex) >= images.length) {
      setSelectedImageIndex("0");
      return;
    }

    const selected = images[Number(selectedImageIndex)];
    const parsed = parseImageSize(selected?.title);
    setImageWidth(parsed.width);
    setImageHeight(parsed.height);
  }, [images, selectedImageIndex]);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      await onSubmitAction(formData);
      // Brief delay to show success animation, then redirect
      setTimeout(() => {
        router.push(`/spaces/${spaceId}/pages/${pageId}`);
      }, 500);
    });
  };

  const appendSnippet = (snippet: string) => {
    setContent((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
  };

  const uploadFile = async (file: File, kind: "image" | "document") => {
    try {
      setUploadError(null);
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("spaceId", spaceId);
      formData.append("pageId", pageId);
      formData.append("kind", kind);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to prepare upload.");
      }

      const payload = (await response.json()) as {
        assetUrl: string;
      };

      if (kind === "image") {
        appendSnippet(`![${file.name}](${payload.assetUrl} "600x")`);
      } else {
        appendSnippet(`[${file.name}](${payload.assetUrl})`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed. Please try again.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      void uploadFile(file, "image");
    }
  };

  const handleDocumentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      void uploadFile(file, "document");
    }
  };

  const handleEditorDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleEditorDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isPending || isUploading) {
      return;
    }

    const files = Array.from(event.dataTransfer.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length === 0) {
      setUploadError("Only image files can be dropped here.");
      return;
    }

    setUploadError(null);
    for (const file of files) {
      await uploadFile(file, "image");
    }
  };

  const handleApplyImageSize = () => {
    if (images.length === 0 || selectedImageIndex === "") {
      setImageSizeError("Select an image to resize.");
      return;
    }

    const normalizedWidth = imageWidth.trim();
    const normalizedHeight = imageHeight.trim();

    if (normalizedHeight && !normalizedWidth) {
      setImageSizeError("Width is required when height is set.");
      return;
    }
    if (normalizedWidth && !/^\d+$/.test(normalizedWidth)) {
      setImageSizeError("Width must be a whole number.");
      return;
    }
    if (normalizedHeight && !/^\d+$/.test(normalizedHeight)) {
      setImageSizeError("Height must be a whole number.");
      return;
    }

    setImageSizeError(null);
    const nextContent = updateImageSize(content, Number(selectedImageIndex), normalizedWidth, normalizedHeight);
    setContent(nextContent);
  };

  return (
    <form action={handleSubmit} className="space-y-6" id="page-editor-form">
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
          disabled={isPending || isUploading}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Content</label>
        <div onDrop={handleEditorDrop} onDragOver={handleEditorDragOver}>
          <MarkdownEditor value={content} onChange={setContent} />
        </div>
        <input type="hidden" name="content" value={content} />
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            disabled={isPending || isUploading}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx"
            className="hidden"
            onChange={handleDocumentChange}
            disabled={isPending || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            disabled={isPending || isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload document
          </Button>
          {isUploading && (
            <span className="text-sm text-muted-foreground">Uploading...</span>
          )}
        </div>
        {uploadError && (
          <p className="text-sm text-destructive">{uploadError}</p>
        )}
        <div className="rounded-md border p-3 space-y-3">
          <p className="text-sm font-medium">Image size</p>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedImageIndex}
              onValueChange={setSelectedImageIndex}
              disabled={images.length === 0 || isPending || isUploading}
            >
              <SelectTrigger size="sm" className="min-w-[180px]">
                <SelectValue placeholder="Select image" />
              </SelectTrigger>
              <SelectContent>
                {images.map((image, index) => {
                  const name = image.alt || image.url.split("/").pop() || `Image ${index + 1}`;
                  return (
                    <SelectItem key={`${image.url}-${index}`} value={`${index}`}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="Width (px)"
              value={imageWidth}
              onChange={(event) => setImageWidth(event.target.value)}
              className="h-8 w-28"
              disabled={isPending || isUploading || images.length === 0}
            />
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="Height (px)"
              value={imageHeight}
              onChange={(event) => setImageHeight(event.target.value)}
              className="h-8 w-28"
              disabled={isPending || isUploading || images.length === 0}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyImageSize}
              disabled={isPending || isUploading || images.length === 0}
            >
              Apply size
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Uses the markdown title syntax like {"![alt](url \"800x600\")"}. Leave fields blank to
            remove sizing.
          </p>
          {imageSizeError && <p className="text-sm text-destructive">{imageSizeError}</p>}
        </div>
      </div>
    </form>
  );
}
