import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveMembership } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function AppHome() {
  const membership = await getActiveMembership();
  if (!membership) {
    redirect("/orgs");
  }
  
  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-12">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-medium text-primary mb-2">
            Welcome to your workspace
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            <span className="gradient-text">
              {membership.organization.name}
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Explore spaces and keep your documentation up to date. 
            Your team&apos;s knowledge, connected and accessible.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="gradient">
              <Link href="/spaces">
                <SpacesIcon />
                Browse Spaces
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/search">
                <SearchIcon />
                Search Pages
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            href="/spaces"
            icon={<SpacesIcon className="size-5" />}
            title="Spaces"
            description="Organize documentation into spaces and folders"
          />
          <QuickActionCard
            href="/search"
            icon={<SearchIcon className="size-5" />}
            title="Search"
            description="Find pages by title or content"
          />
          <QuickActionCard
            href="/orgs"
            icon={<OrgIcon className="size-5" />}
            title="Organizations"
            description="Manage your workspaces"
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ 
  href, 
  icon, 
  title, 
  description 
}: { 
  href: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full cursor-pointer group">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {icon}
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SpacesIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function SearchIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function OrgIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
