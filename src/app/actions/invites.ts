"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import { requireUser, setActiveOrgId } from "@/lib/session";
import { requireRole } from "@/lib/permissions";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export async function createInvite(formData: FormData) {
  const user = await requireUser();
  const membership = await requireRole("ADMIN");
  const organizationId = membership.organizationId;

  const parsed = inviteSchema.parse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  const token = crypto.randomBytes(32).toString("hex");
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await db.invite.create({
    data: {
      organizationId,
      email: parsed.email,
      role: parsed.role,
      token,
      code,
      expiresAt,
      invitedById: user.id,
    },
  });

  const organization = await db.organization.findUnique({
    where: { id: organizationId },
  });

  await sendInviteEmail({
    email: invite.email,
    organizationName: organization?.name ?? "your organization",
    role: invite.role,
    token,
    code,
  });

  await db.auditLog.create({
    data: {
      organizationId,
      actorId: user.id,
      action: "INVITE_SEND",
      targetType: "invite",
      targetId: invite.id,
      metadata: { email: invite.email },
    },
  });

  revalidatePath("/invites");
}

export async function acceptInvite(formData: FormData) {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "");
  const code = String(formData.get("code") ?? "");

  if (!token && !code) {
    throw new Error("Invite token or code is required.");
  }

  const orConditions: Array<{ token?: string; code?: string }> = [];
  if (token) {
    orConditions.push({ token });
  }
  if (code) {
    orConditions.push({ code });
  }

  const invite = await db.invite.findFirst({
    where: {
      acceptedAt: null,
      expiresAt: { gt: new Date() },
      OR: orConditions,
    },
  });

  if (!invite) {
    throw new Error("Invite not found or expired.");
  }

  await db.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: invite.organizationId,
      },
    },
    update: {
      role: invite.role,
    },
    create: {
      userId: user.id,
      organizationId: invite.organizationId,
      role: invite.role,
    },
  });

  await db.invite.update({
    where: { id: invite.id },
    data: {
      acceptedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      organizationId: invite.organizationId,
      actorId: user.id,
      action: "INVITE_ACCEPT",
      targetType: "invite",
      targetId: invite.id,
      metadata: { email: invite.email },
    },
  });

  await setActiveOrgId(invite.organizationId);
  revalidatePath("/orgs");
  redirect("/spaces");
}
