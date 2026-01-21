import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getSpaceAccess } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/wiki/breadcrumbs";
import { CreatePageDialog } from "@/components/wiki/create-page-dialog";
import { FileText, Plus, ArrowLeft } from "lucide-react";

type FolderPageProps = {
  params: Promise<{ spaceId: string; folderId: string }>;
};

export default async function FolderPage({ params: paramsPromise }: FolderPageProps) {
  const params = await paramsPromise;
  const user = await getCurrentUser();
  const access = await getSpaceAccess(params.spaceId, user?.id ?? null);
  if (!access || !access.permissions.view) {
    if (!user) {
      redirect("/signin");
    }
    redirect("/spaces");
  }

  const folder = await db.folder.findFirst({
    where: {
      id: params.folderId,
      spaceId: params.spaceId,
    },
    include: {
      space: true,
    },
  });

  if (!folder) {
    redirect(`/spaces/${params.spaceId}`);
  }

  const pages = await db.page.findMany({
    where: {
      folderId: folder.id,
    },
    orderBy: { updatedAt: "desc" },
  });

  const userCanEdit = access.permissions.edit;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Spaces", href: "/spaces" },
          { label: folder.space.name, href: `/spaces/${folder.space.id}` },
          { label: folder.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link
              href={`/spaces/${folder.space.id}`}
              className="flex items-center gap-1 text-sm hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              {folder.space.name}
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {folder.name}
          </h1>
        </div>
        {userCanEdit && (
          <CreatePageDialog spaceId={params.spaceId} defaultFolderId={folder.id}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New page
            </Button>
          </CreatePageDialog>
        )}
      </div>

      {/* Pages list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pages in this folder</CardTitle>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No pages in this folder yet.</p>
              {userCanEdit && (
                <p className="text-sm mt-1">
                  Click &quot;New page&quot; to create one.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{page.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Updated {page.updatedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/spaces/${params.spaceId}/pages/${page.id}`}>
                      Open
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
