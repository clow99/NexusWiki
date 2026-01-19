import { getActiveMembership } from "@/lib/session";

export type Role = "ADMIN" | "EDITOR" | "VIEWER";

const roleRank: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
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
