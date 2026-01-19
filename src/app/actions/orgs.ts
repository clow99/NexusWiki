"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser, setActiveOrgId } from "@/lib/session";

export async function setActiveOrg(formData: FormData) {
  const user = await requireUser();
  const orgId = String(formData.get("orgId") ?? "");

  if (!orgId) {
    throw new Error("Organization is required.");
  }

  const membership = await db.membership.findFirst({
    where: {
      organizationId: orgId,
      userId: user.id,
    },
  });

  if (!membership) {
    throw new Error("Not a member of this organization.");
  }

  setActiveOrgId(orgId);
  revalidatePath("/");
}
