import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveMembership } from "@/lib/session";

export default async function AppHome() {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to Nexus Wiki
        </h1>
        <p className="text-sm text-muted-foreground">
          Explore spaces and keep your documentation up to date.
        </p>
      </div>
      <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="text-primary underline" href="/spaces">
            Browse spaces
          </Link>
          <Link className="text-primary underline" href="/search">
            Search pages
          </Link>
        </div>
      </div>
    </div>
  );
}
