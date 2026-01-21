import { db } from "@/lib/db";
import { getActiveMembership, getCurrentUser, requireUser } from "@/lib/session";

export type Role = "ADMIN" | "EDITOR" | "VIEWER";
export type SpacePermission = "view" | "edit" | "delete";
export type SpacePermissionSet = {
  view: boolean;
  edit: boolean;
  delete: boolean;
};

const roleRank: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

const fullSpacePermissions: SpacePermissionSet = {
  view: true,
  edit: true,
  delete: true,
};

export function canEdit(role: Role) {
  return roleRank[role] >= roleRank.EDITOR;
}

export function canAdmin(role: Role) {
  return roleRank[role] >= roleRank.ADMIN;
}

export async function requireRole(required: Role) {
  const membership = await getActiveMembership();
  if (!membership) {
    throw new Error("No active organization selected.");
  }

  if (roleRank[membership.role] < roleRank[required]) {
    throw new Error("Insufficient permissions.");
  }

  return membership;
}

function resolveSpacePermissions(role?: {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
} | null): SpacePermissionSet {
  if (!role) {
    return { view: false, edit: false, delete: false };
  }
  return {
    view: role.canView,
    edit: role.canEdit,
    delete: role.canDelete,
  };
}

export async function getSpaceAccess(spaceId: string, userId?: string | null) {
  const space = await db.space.findUnique({
    where: { id: spaceId },
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      visibility: true,
      defaultRoleId: true,
    },
  });
  if (!space) {
    return null;
  }

  let membership: {
    id: string;
    userId: string;
    organizationId: string;
    role: Role;
  } | null = null;
  let role: {
    id: string;
    name: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  } | null = null;
  let permissions: SpacePermissionSet = { view: false, edit: false, delete: false };

  if (userId) {
    membership = await db.membership.findFirst({
      where: { userId, organizationId: space.organizationId },
    });

    if (membership?.role === "ADMIN") {
      return { space, membership, role, permissions: fullSpacePermissions };
    }

    if (membership) {
      const assignment = await db.spaceRoleAssignment.findFirst({
        where: { spaceId, userId },
        include: { role: true },
      });

      if (assignment?.role) {
        role = assignment.role;
        permissions = resolveSpacePermissions(assignment.role);
      } else if (space.defaultRoleId) {
        role = await db.spaceRole.findUnique({
          where: { id: space.defaultRoleId },
          select: {
            id: true,
            name: true,
            canView: true,
            canEdit: true,
            canDelete: true,
          },
        });
        permissions = resolveSpacePermissions(role);
      } else {
        permissions = { view: true, edit: false, delete: false };
      }

      return { space, membership, role, permissions };
    }
  }

  if (space.visibility === "PUBLIC") {
    permissions = { view: true, edit: false, delete: false };
  }

  return { space, membership, role, permissions };
}

export async function requireSpacePermission(spaceId: string, permission: SpacePermission) {
  const user = await requireUser();
  const access = await getSpaceAccess(spaceId, user.id);
  if (!access || !access.permissions[permission]) {
    throw new Error("Insufficient permissions.");
  }

  return { ...access, user };
}

export async function getCurrentUserSpaceAccess(spaceId: string) {
  const user = await getCurrentUser();
  return getSpaceAccess(spaceId, user?.id ?? null);
}
