import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ACTIVE_ORG_COOKIE = "active_org";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function getActiveOrgId() {
  return cookies().get(ACTIVE_ORG_COOKIE)?.value ?? null;
}

export function setActiveOrgId(orgId: string) {
  cookies().set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getActiveMembership() {
  const user = await requireUser();
  const orgId = getActiveOrgId();
  if (!orgId) {
    return null;
  }
  return db.membership.findFirst({
    where: {
      userId: user.id,
      organizationId: orgId,
    },
    include: {
      organization: true,
    },
  });
}
