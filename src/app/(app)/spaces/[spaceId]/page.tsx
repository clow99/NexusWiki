import Link from "next/link";
import { redirect } from "next/navigation";

import { createFolder, createPage } from "@/app/actions/wiki";
import { db } from "@/lib/db";
import { getActiveMembership } from "@/lib/session";
import { canEdit } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SpacePageProps = {
  params: { spaceId: string };
};

export default async function SpacePage({ params }: SpacePageProps) {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }

  const space = await db.space.findFirst({
    where: {
      id: params.spaceId,
      organizationId: membership.organizationId,
    },
  });

  if (!space) {
    redirect("/spaces");
  }

  const folders = await db.folder.findMany({
    where: { spaceId: space.id },
    orderBy: { name: "asc" },
  });

  const pages = await db.page.findMany({
    where: { spaceId: space.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Space</p>
        <h1 className="text-2xl font-semibold tracking-tight">{space.name}</h1>
      </div>

      {canEdit(membership.role) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create a folder</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createFolder} className="space-y-4">
                <input type="hidden" name="spaceId" value={space.id} />
                <Input name="name" placeholder="Folder name" required />
                <Button type="submit">Create folder</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create a page</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createPage} className="space-y-4">
                <input type="hidden" name="spaceId" value={space.id} />
                <Input name="title" placeholder="Page title" required />
                <Textarea
                  name="content"
                  placeholder="Start writing markdown..."
                  rows={4}
                  required
                />
                <select
                  name="folderId"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                  defaultValue=""
                >
                  <option value="">No folder</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <Button type="submit">Create page</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Folders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {folders.length === 0 && <p>No folders yet.</p>}
            {folders.map((folder) => (
              <div key={folder.id} className="flex items-center justify-between">
                <span>{folder.name}</span>
                <span className="text-xs">Slug: {folder.slug}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pages.length === 0 && (
              <p className="text-sm text-muted-foreground">No pages yet.</p>
            )}
            {pages.map((page) => (
              <div key={page.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{page.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Updated {page.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/spaces/${space.id}/pages/${page.id}`}>Open</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
