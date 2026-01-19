import { redirect } from "next/navigation";

import { createInvite } from "@/app/actions/invites";
import { db } from "@/lib/db";
import { getActiveMembership } from "@/lib/session";
import { canAdmin } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function InvitesPage() {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }

  const invites = await db.invite.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invites</h1>
        <p className="text-sm text-muted-foreground">
          Invite teammates to join your organization.
        </p>
      </div>

      {canAdmin(membership.role) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send an invite</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createInvite} className="space-y-4">
              <Input name="email" type="email" placeholder="Email address" />
              <select
                name="role"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                defaultValue="VIEWER"
              >
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <Button type="submit">Send invite</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent invites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {invites.length === 0 && <p>No invites yet.</p>}
          {invites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{invite.email}</div>
                <div className="text-xs text-muted-foreground">
                  Role: {invite.role} ·{" "}
                  {invite.acceptedAt ? "Accepted" : "Pending"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Expires {invite.expiresAt.toLocaleDateString()}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
