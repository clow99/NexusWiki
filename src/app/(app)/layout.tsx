import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold text-muted-foreground">
              Nexus Wiki
            </div>
            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/">Home</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/spaces">Spaces</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/search">Search</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/orgs">Organizations</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/invites">Invites</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/audit">Audit</Link>
              </Button>
            </nav>
          </div>
          <div className="text-sm text-muted-foreground">
            Signed in as {session.user.email ?? "user"}
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
