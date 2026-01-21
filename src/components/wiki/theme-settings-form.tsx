"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ThemeOption = {
  id: string;
  label: string;
  previewClass?: string;
  swatch?: string;
};

type ThemeSettingsFormProps = {
  backgroundOptions: ThemeOption[];
  accentOptions: ThemeOption[];
  initialBackground: string;
  initialAccent: string;
  logoUrl: string | null;
  onSaveTheme: (formData: FormData) => Promise<void>;
};

export function ThemeSettingsForm({
  backgroundOptions,
  accentOptions,
  initialBackground,
  initialAccent,
  logoUrl,
  onSaveTheme,
}: ThemeSettingsFormProps) {
  const router = useRouter();
  const [background, setBackground] = useState(initialBackground);
  const [accent, setAccent] = useState(initialAccent);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogoUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!logoFile) {
      setUploadError("Choose an image before uploading.");
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", logoFile);
      const response = await fetch("/api/orgs/theme/logo", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Upload failed.");
      }
      setLogoFile(null);
      form.reset();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={onSaveTheme} className="space-y-6">
            <input type="hidden" name="background" value={background} />
            <input type="hidden" name="accent" value={accent} />

            <div className="space-y-2">
              <label className="text-sm font-medium">Background</label>
              <Select value={background} onValueChange={setBackground}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue placeholder="Select a background" />
                </SelectTrigger>
                <SelectContent>
                  {backgroundOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-4 w-4 rounded border border-border ${option.previewClass ?? ""}`}
                        />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Accent color</label>
              <Select value={accent} onValueChange={setAccent}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue placeholder="Select an accent" />
                </SelectTrigger>
                <SelectContent>
                  {accentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-border"
                          style={{ backgroundColor: option.swatch ?? "transparent" }}
                        />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit">Save theme</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <img
                src={logoUrl}
                alt="Organization logo"
                className="h-10 w-auto"
              />
              <span className="text-xs text-muted-foreground">
                Uploading a new logo will replace the current one.
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload a logo to replace the default branding.
            </p>
          )}
          <form onSubmit={handleLogoUpload} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
            />
            <Button type="submit" disabled={!logoFile || isUploading}>
              {isUploading ? "Uploading..." : "Upload logo"}
            </Button>
          </form>
          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
