import Link from "next/link";
import Image from "next/image";
import { Menu, Search, LogOut, Settings, User, Bell, ChevronDown, Command } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveMembership, getActiveOrgId } from "@/lib/session";
import { canEdit, getSpaceAccess } from "@/lib/permissions";
import { setActiveOrg } from "@/app/actions/orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarWrapper } from "@/components/wiki/sidebar-wrapper";

async function getSidebarData(organizationId: string) {
  const spaces = await db.space.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: {
      folders: {
        orderBy: { name: "asc" },
      },
      pages: {
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          folderId: true,
        },
      },
    },
  });

  return spaces;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-50 header-glass border-b border-border/50">
          <div className="flex h-16 items-center justify-between px-4 md:px-6 gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/nexuswiki_logo.png"
                alt="NexusWiki"
                width={160}
                height={50}
                className="h-9 w-auto"
                priority
              />
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/signin">Sign in</Link>
            </Button>
          </div>
        </header>
        <main className="p-6 max-w-[1600px] mx-auto">{children}</main>
      </div>
    );
  }

  const membership = await getActiveMembership();
  const spaces = membership ? await getSidebarData(membership.organizationId) : [];
  const spaceAccess = membership
    ? await Promise.all(
        spaces.map((space) => getSpaceAccess(space.id, session.user?.id ?? null)),
      )
    : [];
  const permissionsBySpaceId = new Map(
    spaceAccess
      .filter((access): access is NonNullable<typeof access> => Boolean(access))
      .map((access) => [access.space.id, access.permissions]),
  );
  const visibleSpaces = spaces
    .filter((space) => permissionsBySpaceId.get(space.id)?.view ?? false)
    .map((space) => ({
      ...space,
      canEdit: permissionsBySpaceId.get(space.id)?.edit ?? false,
    }));
  const userCanEdit = membership ? canEdit(membership.role) : false;
  const activeOrgId = await getActiveOrgId();
  const orgTheme = membership
    ? await db.organizationTheme.findUnique({
        where: { organizationId: membership.organizationId },
      })
    : null;
  const themeBackground = orgTheme?.background ?? "default";
  const themeAccent = orgTheme?.accent ?? "blue";
  const themeLogoUrl = orgTheme?.logoKey
    ? `/api/orgs/theme/logo?v=${orgTheme.logoUpdatedAt?.getTime() ?? "0"}`
    : "/nexuswiki_logo.png";
  const notifications = membership
    ? await db.auditLog.findMany({
        where: { organizationId: membership.organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { actor: true },
      })
    : [];
  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  const userInitials = session.user.name
    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : session.user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className={`min-h-screen theme-bg-${themeBackground} theme-accent-${themeAccent}`}>
      {/* Enhanced sticky header */}
      <header className="sticky top-0 z-50 header-glass border-b border-border/50">
        <div className="flex h-16 items-center justify-between px-4 md:px-6 gap-4">
          {/* Left section: Mobile menu + Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile sidebar toggle */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden shrink-0 hover:bg-primary/10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SidebarWrapper spaces={visibleSpaces} canCreateSpace={userCanEdit} />
              </SheetContent>
            </Sheet>

            {/* Logo with enhanced hover effect */}
            <Link href="/" className="flex items-center gap-3 group relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-primary/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />
              <Image
                src={themeLogoUrl}
                alt="NexusWiki"
                width={160}
                height={50}
                className="h-9 w-auto transition-all duration-300 group-hover:scale-105 relative"
                unoptimized
                priority
              />
            </Link>
          </div>

          {/* Center section: Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form action="/search" method="GET" className="w-full">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  name="q"
                  type="search"
                  placeholder="Search documentation..."
                  className="w-full pl-10 pr-16 h-10 bg-muted/50 border-transparent hover:border-border focus:border-primary/50 focus:bg-background transition-all duration-200 rounded-xl"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <Command className="h-3 w-3" />K
                </kbd>
              </div>
            </form>
          </div>
          
          {/* Right section: Navigation + User */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation Pills */}
            <nav className="hidden lg:flex items-center bg-muted/50 p-1 rounded-xl">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/spaces">Spaces</NavLink>
              <NavLink href="/orgs">Orgs</NavLink>
              <NavLink href="/audit">Audit</NavLink>
            </nav>

            {/* Organization switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex items-center gap-2 rounded-xl border-border/60 bg-background/80"
                >
                  <span className="max-w-[160px] truncate">
                    {membership?.organization.name ?? "Select org"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {memberships.length === 0 ? (
                  <DropdownMenuItem asChild>
                    <Link href="/orgs" className="cursor-pointer">
                      Create or join an organization
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  memberships.map((orgMembership) => (
                    <form key={orgMembership.id} action={setActiveOrg}>
                      <input
                        type="hidden"
                        name="orgId"
                        value={orgMembership.organizationId}
                      />
                      <DropdownMenuItem asChild>
                        <button
                          type="submit"
                          className="flex w-full items-center justify-between"
                        >
                          <span
                            className={
                              activeOrgId === orgMembership.organizationId
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {orgMembership.organization.name}
                          </span>
                          {activeOrgId === orgMembership.organizationId && (
                            <span className="text-xs text-muted-foreground">Active</span>
                          )}
                        </button>
                      </DropdownMenuItem>
                    </form>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/orgs" className="cursor-pointer">
                    Manage organizations
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile search button */}
            <Link href="/search" className="md:hidden">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-primary/10 hidden sm:flex"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Recent activity</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <DropdownMenuItem disabled>No notifications yet.</DropdownMenuItem>
                ) : (
                  notifications.map((log) => (
                    <DropdownMenuItem key={log.id} className="flex flex-col items-start gap-1">
                      <span className="text-sm font-medium text-foreground">{log.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {log.actor?.email ?? "System"} · {log.createdAt.toLocaleString()}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/audit" className="cursor-pointer">
                    View all activity
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-primary/10 rounded-xl"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
                    <span className="text-sm font-semibold text-primary-foreground">
                      {userInitials}
                    </span>
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium leading-none">
                      {session.user.name ?? "User"}
                    </span>
                    <span className="text-xs text-muted-foreground leading-none mt-0.5">
                      {membership?.role ?? "Member"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name ?? "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/invites" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Invites
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orgs" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Organizations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout" className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main layout with sidebar */}
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] border-r theme-sidebar">
          <SidebarWrapper spaces={visibleSpaces} canCreateSpace={userCanEdit} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-6 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href}
      className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg transition-all duration-200"
    >
      {children}
    </Link>
  );
}
