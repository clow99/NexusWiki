import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers, Plus } from "lucide-react";

import { db } from "@/lib/db";
import { getActiveMembership } from "@/lib/session";
import { canAdmin, getSpaceAccess } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/wiki/breadcrumbs";
import { CreateSpaceDialog } from "@/components/wiki/create-space-dialog";

export default async function SpacesPage() {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }

  const spaces = await db.space.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          folders: true,
          pages: true,
        },
      },
    },
  });
  const accessList = await Promise.all(
    spaces.map((space) => getSpaceAccess(space.id, membership.userId)),
  );
  const permissionsBySpaceId = new Map(
    accessList
      .filter((access): access is NonNullable<typeof access> => Boolean(access))
      .map((access) => [access.space.id, access.permissions]),
  );
  const visibleSpaces = spaces.filter(
    (space) => permissionsBySpaceId.get(space.id)?.view ?? false,
  );

  const userCanAdmin = canAdmin(membership.role);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Spaces" }]} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Spaces</h1>
          <p className="text-sm text-muted-foreground">
            Organize documentation into spaces and folders.
          </p>
        </div>
        {userCanAdmin && (
          <CreateSpaceDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New space
            </Button>
          </CreateSpaceDialog>
        )}
      </div>

      {/* Spaces grid */}
      {visibleSpaces.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-1">No spaces yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first space to start organizing documentation.
            </p>
            {userCanAdmin && (
              <CreateSpaceDialog>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create a space
                </Button>
              </CreateSpaceDialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSpaces.map((space) => (
            <Link key={space.id} href={`/spaces/${space.id}`}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {space.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 mb-3">
                    {space.description ?? "No description provided."}
                  </CardDescription>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{space._count.folders} folders</span>
                    <span>{space._count.pages} pages</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
