import { redirect } from "next/navigation";

import { updateOrganizationTheme } from "@/app/actions/orgs";
import { db } from "@/lib/db";
import { DEFAULT_THEME, THEME_ACCENTS, THEME_BACKGROUNDS } from "@/lib/org-theme";
import { requireRole } from "@/lib/permissions";
import { ThemeSettingsForm } from "@/components/wiki/theme-settings-form";

const backgroundOptions = [
  { id: "default", label: "Default", previewClass: "theme-bg-default" },
  { id: "slate", label: "Slate", previewClass: "theme-bg-slate" },
  { id: "graphite", label: "Graphite", previewClass: "theme-bg-graphite" },
  { id: "paper", label: "Paper", previewClass: "theme-bg-paper" },
  { id: "sunset", label: "Sunset", previewClass: "theme-bg-sunset" },
  { id: "midnight", label: "Midnight", previewClass: "theme-bg-midnight" },
  { id: "obsidian", label: "Obsidian", previewClass: "theme-bg-obsidian" },
  { id: "forest", label: "Forest", previewClass: "theme-bg-forest" },
  { id: "nebula", label: "Nebula", previewClass: "theme-bg-nebula" },
] satisfies { id: (typeof THEME_BACKGROUNDS)[number]; label: string; previewClass: string }[];

const accentOptions = [
  { id: "blue", label: "Blue", swatch: "#3b82f6" },
  { id: "indigo", label: "Indigo", swatch: "#6366f1" },
  { id: "emerald", label: "Emerald", swatch: "#10b981" },
  { id: "rose", label: "Rose", swatch: "#f43f5e" },
  { id: "amber", label: "Amber", swatch: "#f59e0b" },
  { id: "sky", label: "Sky", swatch: "#38bdf8" },
  { id: "mint", label: "Mint", swatch: "#34d399" },
  { id: "lavender", label: "Lavender", swatch: "#a78bfa" },
  { id: "peach", label: "Peach", swatch: "#fbbf24" },
] satisfies { id: (typeof THEME_ACCENTS)[number]; label: string; swatch: string }[];

export default async function OrganizationThemePage() {
  const membership = await requireRole("ADMIN");
  if (!membership) {
    redirect("/orgs");
  }

  const theme = await db.organizationTheme.findUnique({
    where: { organizationId: membership.organizationId },
  });

  const currentBackground = theme?.background ?? DEFAULT_THEME.background;
  const currentAccent = theme?.accent ?? DEFAULT_THEME.accent;
  const logoUrl = theme?.logoKey
    ? `/api/orgs/theme/logo?v=${theme.logoUpdatedAt?.getTime() ?? "0"}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Theme</h1>
        <p className="text-sm text-muted-foreground">
          Customize the workspace branding for your organization.
        </p>
      </div>
      <ThemeSettingsForm
        backgroundOptions={backgroundOptions}
        accentOptions={accentOptions}
        initialBackground={currentBackground}
        initialAccent={currentAccent}
        logoUrl={logoUrl}
        onSaveTheme={updateOrganizationTheme}
      />
    </div>
  );
}
