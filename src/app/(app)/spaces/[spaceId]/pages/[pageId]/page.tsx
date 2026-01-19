import Link from "next/link";
import { redirect } from "next/navigation";

import { restorePageRevision } from "@/app/actions/wiki";
import { db } from "@/lib/db";
import { getActiveMembership } from "@/lib/session";
import { canEdit } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MarkdownViewer } from "@/components/wiki/markdown-viewer";

type PageViewProps = {
  params: { spaceId: string; pageId: string };
};

export default async function PageView({ params }: PageViewProps) {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }

  const page = await db.page.findFirst({
    where: {
      id: params.pageId,
      spaceId: params.spaceId,
      organizationId: membership.organizationId,
    },
  });

  if (!page) {
    redirect(`/spaces/${params.spaceId}`);
  }

  const revisions = await db.pageRevision.findMany({
    where: { pageId: page.id },
    orderBy: { version: "desc" },
    take: 8,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Page</p>
          <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
        </div>
        {canEdit(membership.role) && (
          <Button asChild variant="secondary">
            <Link href={`/spaces/${params.spaceId}/pages/${page.id}/edit`}>
              Edit page
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <MarkdownViewer content={page.content} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {revisions.length === 0 && <p>No revisions yet.</p>}
          {revisions.map((revision, index) => (
            <div key={revision.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Version {revision.version}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {revision.createdAt.toLocaleString()}
                  </div>
                </div>
                {canEdit(membership.role) && (
                  <form action={restorePageRevision}>
                    <input type="hidden" name="pageId" value={page.id} />
                    <input
                      type="hidden"
                      name="revisionId"
                      value={revision.id}
                    />
                    <Button type="submit" size="sm" variant="outline">
                      Restore
                    </Button>
                  </form>
                )}
              </div>
              {index < revisions.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
