"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { THEME_ACCENTS, THEME_BACKGROUNDS } from "@/lib/org-theme";
import { requireRole } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import { requireUser, setActiveOrgId } from "@/lib/session";

const createOrgSchema = z.object({
  name: z.string().trim().min(2).max(60),
});

const themeSchema = z.object({
  background: z.enum(THEME_BACKGROUNDS),
  accent: z.enum(THEME_ACCENTS),
});

async function buildUniqueSlug(name: string) {
  const base = slugify(name);
  if (!base) {
    throw new Error("Organization name is required.");
  }

  let slug = base;
  let suffix = 1;
  while (await db.organization.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
    if (suffix > 10) {
      throw new Error("Organization name is already taken.");
    }
  }

  return slug;
}

export async function createOrganization(formData: FormData) {
  const user = await requireUser();
  const parsed = createOrgSchema.parse({
    name: formData.get("name"),
  });
  const slug = await buildUniqueSlug(parsed.name);

  const organization = await db.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: {
        name: parsed.name,
        slug,
        memberships: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: created.id,
        actorId: user.id,
        action: "ORG_CREATE",
        targetType: "organization",
        targetId: created.id,
        metadata: {
          name: created.name,
          slug: created.slug,
        },
      },
    });

    return created;
  });

  await setActiveOrgId(organization.id);
  revalidatePath("/orgs");
  revalidatePath("/");
  redirect("/spaces");
}

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

  await setActiveOrgId(orgId);
  revalidatePath("/");
}

export async function updateOrganizationTheme(formData: FormData) {
  const membership = await requireRole("ADMIN");
  const parsed = themeSchema.parse({
    background: formData.get("background"),
    accent: formData.get("accent"),
  });

  await db.organizationTheme.upsert({
    where: { organizationId: membership.organizationId },
    update: {
      background: parsed.background,
      accent: parsed.accent,
    },
    create: {
      organizationId: membership.organizationId,
      background: parsed.background,
      accent: parsed.accent,
    },
  });

  revalidatePath("/orgs/theme");
  revalidatePath("/");
}
