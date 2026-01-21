import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FolderOpen,
  FileText,
  Plus,
  ArrowLeft,
  ChevronRight,
  Layers,
} from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getSpaceAccess } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/wiki/breadcrumbs";
import { CreateFolderDialog } from "@/components/wiki/create-folder-dialog";
import { CreatePageDialog } from "@/components/wiki/create-page-dialog";
import {
  assignSpaceRole,
  createSpaceRole,
  deleteSpaceRole,
  removeSpaceRoleAssignment,
  updateSpaceDefaultRole,
  updateSpaceRole,
  updateSpaceVisibility,
} from "@/app/actions/wiki";

type SpacePageProps = {
  params: Promise<{ spaceId: string }>;
};

export default async function SpacePage({ params: paramsPromise }: SpacePageProps) {
  const params = await paramsPromise;
  const user = await getCurrentUser();
  const access = await getSpaceAccess(params.spaceId, user?.id ?? null);
  if (!access || !access.permissions.view) {
    if (!user) {
      redirect("/signin");
    }
    redirect("/spaces");
  }

  const space = access.space;

  const folders = await db.folder.findMany({
    where: { spaceId: space.id },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { pages: true },
      },
    },
  });

  const pages = await db.page.findMany({
    where: { spaceId: space.id },
    orderBy: { updatedAt: "desc" },
    include: {
      folder: {
        select: { id: true, name: true },
      },
    },
  });

  const rootPages = pages.filter((p) => !p.folderId);
  const userCanEdit = access.permissions.edit;
  const canManagePermissions = access.membership?.role === "ADMIN";
  const roles = canManagePermissions
    ? await db.spaceRole.findMany({
        where: { spaceId: space.id },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const assignments = canManagePermissions
    ? await db.spaceRoleAssignment.findMany({
        where: { spaceId: space.id },
        include: { user: true, role: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const orgMembers = canManagePermissions
    ? await db.membership.findMany({
        where: { organizationId: space.organizationId },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  // Transform folders for the dialog
  const foldersForDialog = folders.map((f) => ({ id: f.id, name: f.name }));

  const hasContent = folders.length > 0 || rootPages.length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Spaces", href: "/spaces" },
          { label: space.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/spaces"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            All spaces
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{space.name}</h1>
          {space.description && (
            <p className="text-sm text-muted-foreground">{space.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canManagePermissions && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Manage permissions
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Space permissions</DialogTitle>
                  <DialogDescription>
                    Manage visibility, roles, and assignments for this space.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <form action={updateSpaceVisibility} className="space-y-2">
                    <input type="hidden" name="spaceId" value={space.id} />
                    <label className="text-sm font-medium">Visibility</label>
                    <div className="flex items-center gap-2">
                      <select
                        name="visibility"
                        defaultValue={space.visibility}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="MEMBERS_ONLY">Logged in members only</option>
                        <option value="PUBLIC">Unauthenticated users can view</option>
                      </select>
                      <Button type="submit" variant="outline" size="sm">
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Public spaces are view-only for unauthenticated visitors.
                    </p>
                  </form>

                  <form action={updateSpaceDefaultRole} className="space-y-2">
                    <input type="hidden" name="spaceId" value={space.id} />
                    <label className="text-sm font-medium">Default role for members</label>
                    <div className="flex items-center gap-2">
                      <select
                        name="roleId"
                        defaultValue={space.defaultRoleId ?? ""}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">No default role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" variant="outline" size="sm">
                        Save
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    <div className="text-sm font-medium">Roles</div>
                    <form action={createSpaceRole} className="grid gap-3 rounded-lg border p-4">
                      <input type="hidden" name="spaceId" value={space.id} />
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Input
                          name="name"
                          placeholder="Role name"
                          required
                          maxLength={40}
                        />
                        <Button type="submit">Add role</Button>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="canView"
                            defaultChecked
                            className="h-4 w-4 rounded border-input text-primary accent-primary"
                          />
                          View
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="canEdit"
                            className="h-4 w-4 rounded border-input text-primary accent-primary"
                          />
                          Edit
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="canDelete"
                            className="h-4 w-4 rounded border-input text-primary accent-primary"
                          />
                          Delete
                        </label>
                      </div>
                    </form>

                    {roles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No roles created yet.</p>
                    ) : (
                      <div className="grid gap-4">
                        {roles.map((role) => (
                          <form
                            key={role.id}
                            action={updateSpaceRole}
                            className="grid gap-3 rounded-lg border p-4"
                          >
                            <input type="hidden" name="roleId" value={role.id} />
                            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                              <Input name="name" defaultValue={role.name} maxLength={40} />
                              <div className="flex items-center gap-2">
                                <Button type="submit" variant="outline" size="sm">
                                  Save
                                </Button>
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="sm"
                                  formAction={deleteSpaceRole}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  name="canView"
                                  defaultChecked={role.canView}
                                  className="h-4 w-4 rounded border-input text-primary accent-primary"
                                />
                                View
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  name="canEdit"
                                  defaultChecked={role.canEdit}
                                  className="h-4 w-4 rounded border-input text-primary accent-primary"
                                />
                                Edit
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  name="canDelete"
                                  defaultChecked={role.canDelete}
                                  className="h-4 w-4 rounded border-input text-primary accent-primary"
                                />
                                Delete
                              </label>
                            </div>
                          </form>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium">Role assignments</div>
                    <form action={assignSpaceRole} className="grid gap-3 rounded-lg border p-4">
                      <input type="hidden" name="spaceId" value={space.id} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select
                          name="userId"
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          required
                        >
                          <option value="" disabled>
                            Select a member
                          </option>
                          {orgMembers.map((member) => (
                            <option key={member.id} value={member.userId}>
                              {member.user?.email ?? member.user?.name ?? "Member"}
                            </option>
                          ))}
                        </select>
                        <select
                          name="roleId"
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          required
                        >
                          <option value="" disabled>
                            Select a role
                          </option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button type="submit">Assign role</Button>
                    </form>

                    {assignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No role assignments yet.</p>
                    ) : (
                      <div className="grid gap-2">
                        {assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between rounded-lg border px-3 py-2"
                          >
                            <div>
                              <div className="text-sm font-medium">
                                {assignment.user?.email ?? assignment.user?.name ?? "Member"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {assignment.role.name}
                              </div>
                            </div>
                            <form action={removeSpaceRoleAssignment}>
                              <input type="hidden" name="assignmentId" value={assignment.id} />
                              <Button type="submit" variant="ghost" size="sm">
                                Remove
                              </Button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {userCanEdit && (
            <>
              <CreateFolderDialog spaceId={space.id}>
                <Button variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  New folder
                </Button>
              </CreateFolderDialog>
              <CreatePageDialog spaceId={space.id} folders={foldersForDialog}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New page
                </Button>
              </CreatePageDialog>
            </>
          )}
        </div>
      </div>

      {/* Unified Content View */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {!hasContent ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">This space is empty</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Get started by creating a folder to organize your content or add a new page.
              </p>
              {userCanEdit && (
                <div className="flex items-center justify-center gap-2">
                  <CreateFolderDialog spaceId={space.id}>
                    <Button variant="outline" size="sm">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      New folder
                    </Button>
                  </CreateFolderDialog>
                  <CreatePageDialog spaceId={space.id} folders={foldersForDialog}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New page
                    </Button>
                  </CreatePageDialog>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Folders Section */}
              {folders.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/30 border-b">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Folders
                    </span>
                  </div>
                  {folders.map((folder) => (
                    <Link
                      key={folder.id}
                      href={`/spaces/${space.id}/folders/${folder.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <FolderOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium text-sm group-hover:text-primary transition-colors">
                            {folder.name}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {folder._count.pages} {folder._count.pages === 1 ? 'page' : 'pages'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Root Pages Section */}
              {rootPages.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/30 border-b">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Pages
                    </span>
                  </div>
                  {rootPages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/spaces/${space.id}/pages/${page.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors shrink-0">
                          <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-sm truncate block group-hover:text-primary transition-colors">
                            {page.title}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Updated {page.updatedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
