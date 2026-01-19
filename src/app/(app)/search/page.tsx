import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getActiveMembership } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SearchPageProps = {
  searchParams?: { q?: string };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }

  const query = searchParams?.q?.trim() ?? "";
  const results =
    query.length > 1
      ? await db.page.findMany({
          where: {
            organizationId: membership.organizationId,
            OR: [
              { title: { contains: query } },
              { content: { contains: query } },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
        })
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Search across page titles and content.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form className="flex items-center gap-2">
            <Input name="q" defaultValue={query} placeholder="Search pages..." />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {query.length <= 1 && (
          <p className="text-sm text-muted-foreground">
            Enter at least 2 characters to search.
          </p>
        )}
        {query.length > 1 && results.length === 0 && (
          <p className="text-sm text-muted-foreground">No results found.</p>
        )}
        {results.map((page) => (
          <Card key={page.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <div className="text-sm font-medium">{page.title}</div>
                <div className="text-xs text-muted-foreground">
                  Updated {page.updatedAt.toLocaleDateString()}
                </div>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/spaces/${page.spaceId}/pages/${page.id}`}>
                  Open
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
