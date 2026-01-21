import Link from "next/link";

import { createOrganization, setActiveOrg } from "@/app/actions/orgs";
import { db } from "@/lib/db";
import { canAdmin } from "@/lib/permissions";
import { requireUser, getActiveMembership, getActiveOrgId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default async function OrganizationsPage() {
  const user = await requireUser();
  const activeOrgId = await getActiveOrgId();
  const activeMembership = await getActiveMembership();
  const isAdmin = activeMembership ? canAdmin(activeMembership.role) : false;
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Select the workspace you want to work in.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createOrganization} className="space-y-4">
            <Input
              name="name"
              placeholder="Organization name"
              required
              maxLength={60}
            />
            <Button type="submit">Create organization</Button>
          </form>
        </CardContent>
      </Card>
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theme</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Customize branding</p>
              <p className="text-xs text-muted-foreground">
                Choose backgrounds, accent colors, and a logo.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/orgs/theme">Manage theme</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your organizations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {memberships.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You do not belong to any organizations yet.
            </p>
          )}
          {memberships.map((membership, index) => (
            <div key={membership.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    {membership.organization.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Role: {membership.role}
                  </div>
                </div>
                <form action={setActiveOrg}>
                  <input
                    type="hidden"
                    name="orgId"
                    value={membership.organizationId}
                  />
                  <Button
                    type="submit"
                    variant={
                      activeOrgId === membership.organizationId
                        ? "secondary"
                        : "default"
                    }
                  >
                    {activeOrgId === membership.organizationId
                      ? "Active"
                      : "Select"}
                  </Button>
                </form>
              </div>
              {index < memberships.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
