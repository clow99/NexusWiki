import { redirect } from "next/navigation";

import { setActiveOrg } from "@/app/actions/orgs";
import { db } from "@/lib/db";
import { requireUser, getActiveOrgId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function OrganizationsPage() {
  const user = await requireUser();
  const activeOrgId = getActiveOrgId();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!memberships.length) {
    redirect("/signin");
  }

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
          <CardTitle className="text-base">Your organizations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
