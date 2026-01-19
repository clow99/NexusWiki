import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getActiveMembership } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AuditPage() {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }

  const logs = await db.auditLog.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { actor: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Recent actions across your organization.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Latest activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {logs.length === 0 && <p>No audit entries yet.</p>}
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">
                  {log.action}
                </div>
                <div className="text-xs text-muted-foreground">
                  {log.actor?.email ?? "System"} ·{" "}
                  {log.createdAt.toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {log.targetType}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
