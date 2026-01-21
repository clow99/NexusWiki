import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Folder,
  FileText,
  Clock,
  Paperclip,
} from "lucide-react";

import { restorePageRevision } from "@/app/actions/wiki";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getSpaceAccess } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarkdownViewer } from "@/components/wiki/markdown-viewer";
import { Breadcrumbs } from "@/components/wiki/breadcrumbs";
import { TableOfContents } from "@/components/wiki/table-of-contents";
import { VersionHistory } from "@/components/wiki/version-history";

type PageViewProps = {
  params: Promise<{ spaceId: string; pageId: string }>;
};

const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const normalized = value / 1024 ** sizeIndex;
  const precision = normalized >= 10 || sizeIndex === 0 ? 0 : 1;
  return `${normalized.toFixed(precision)} ${units[sizeIndex]}`;
};

export default async function PageView({ params: paramsPromise }: PageViewProps) {
  const params = await paramsPromise;
  const user = await getCurrentUser();
  const access = await getSpaceAccess(params.spaceId, user?.id ?? null);
  if (!access || !access.permissions.view) {
    if (!user) {
      redirect("/signin");
    }
    redirect("/spaces");
  }

  const page = await db.page.findFirst({
    where: {
      spaceId: params.spaceId,
      OR: [{ id: params.pageId }, { slug: params.pageId }],
    },
    include: {
      space: true,
      folder: true,
      createdBy: true,
      updatedBy: true,
    },
  });

  if (!page) {
    redirect(`/spaces/${params.spaceId}`);
  }
  if (page.id !== params.pageId) {
    redirect(`/spaces/${params.spaceId}/pages/${page.id}`);
  }

  const revisions = await db.pageRevision.findMany({
    where: { pageId: page.id },
    orderBy: { version: "desc" },
    take: 8,
  });

  const attachments = await db.asset.findMany({
    where: {
      pageId: page.id,
      isImage: false,
    },
    orderBy: { createdAt: "desc" },
  });

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Spaces", href: "/spaces" },
    { label: page.space.name, href: `/spaces/${page.space.id}` },
  ];
  if (page.folder) {
    breadcrumbItems.push({
      label: page.folder.name,
      href: `/spaces/${page.space.id}/folders/${page.folder.id}`,
    });
  }
  breadcrumbItems.push({ label: page.title });

  const userCanEdit = access.permissions.edit;

  // Calculate word count
  const wordCount = page.content
    .replace(/[#*`\[\]()]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Estimate reading time (assuming 200 words per minute)
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const hasHeadings = /^(#{1,3})\s+.+/m.test(page.content);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href={
              page.folder
                ? `/spaces/${page.space.id}/folders/${page.folder.id}`
                : `/spaces/${page.space.id}`
            }
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            {page.folder ? page.folder.name : page.space.name}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {page.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {readingTime} min read
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {wordCount.toLocaleString()} words
            </span>
          </div>
        </div>
        {userCanEdit && (
          <Button asChild className="btn-glow">
            <Link href={`/spaces/${params.spaceId}/pages/${page.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit page
            </Link>
          </Button>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          <Card className="card-hover">
            <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
              <MarkdownViewer content={page.content} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Page Info Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Page Info
              </h3>

              {/* Created By */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-sm font-medium">
                    {page.createdBy?.name || page.createdBy?.email || "Unknown"}
                  </p>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {page.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Updated By */}
              {page.updatedBy && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Last edited by</p>
                    <p className="text-sm font-medium">
                      {page.updatedBy.name || page.updatedBy.email || "Unknown"}
                    </p>
                  </div>
                </div>
              )}

              {/* Updated At */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Last updated</p>
                  <p className="text-sm font-medium">
                    {page.updatedAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Folder */}
              {page.folder && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Folder className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Folder</p>
                    <Badge variant="secondary" className="text-xs">
                      {page.folder.name}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {attachments.length > 0 && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Attachments
                </h3>
                <div className="space-y-2">
                  {attachments.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-border/60 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-muted p-1.5">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <Link
                            href={`/api/uploads/${asset.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {asset.filename}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(asset.size)} ·{" "}
                            {asset.createdAt.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/api/uploads/${asset.id}`}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Download
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table of Contents */}
          {hasHeadings && (
            <Card>
              <CardContent className="pt-6">
                <TableOfContents content={page.content} />
              </CardContent>
            </Card>
          )}

          {/* Version History */}
          <Card>
            <CardContent className="pt-6">
              <VersionHistory
                revisions={revisions}
                pageId={page.id}
                canEdit={userCanEdit}
                restoreAction={restorePageRevision}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
