import Link from "next/link";
import { redirect } from "next/navigation";

import { createSpace } from "@/app/actions/wiki";
import { db } from "@/lib/db";
import { getActiveMembership } from "@/lib/session";
import { canAdmin } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default async function SpacesPage() {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }

  const spaces = await db.space.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Spaces</h1>
        <p className="text-sm text-muted-foreground">
          Organize documentation into spaces and folders.
        </p>
      </div>

      {canAdmin(membership.role) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a space</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSpace} className="space-y-4">
              <Input name="name" placeholder="Space name" required />
              <Textarea
                name="description"
                placeholder="Optional description"
                rows={3}
              />
              <Button type="submit">Create space</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {spaces.map((space) => (
          <Card key={space.id}>
            <CardHeader>
              <CardTitle className="text-base">{space.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {space.description ?? "No description provided."}
              </p>
              <Button asChild variant="secondary">
                <Link href={`/spaces/${space.id}`}>Open space</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
