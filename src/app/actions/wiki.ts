"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { getSpaceAccess, requireRole, requireSpacePermission } from "@/lib/permissions";
import { createEmbedding } from "@/lib/ai";

const spaceSchema = z.object({
  name: z.string().min(2, "Space name is required."),
  description: z.string().optional(),
});

const folderSchema = z.object({
  name: z.string().min(2, "Folder name is required."),
  spaceId: z.string().min(1),
});

const pageSchema = z.object({
  title: z.string().min(2, "Title is required."),
  content: z.string().min(1, "Content is required."),
  spaceId: z.string().min(1),
  folderId: z.string().optional(),
});

const pageUpdateSchema = z.object({
  pageId: z.string().min(1),
  title: z.string().min(2),
  content: z.string().min(1),
});

function buildPageEmbeddingInput(title: string, content: string) {
  return `${title}\n\n${content}`;
}

function hashContent(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function parseCheckboxValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

async function upsertPageEmbedding(params: {
  organizationId: string;
  pageId: string;
  title: string;
  content: string;
}) {
  const input = buildPageEmbeddingInput(params.title, params.content);
  const contentHash = hashContent(input);
  const existing = await db.pageEmbedding.findUnique({
    where: { pageId: params.pageId },
    select: { contentHash: true },
  });

  if (existing?.contentHash === contentHash) {
    return;
  }

  const embedding = await createEmbedding(input);
  if (embedding.length === 0) {
    return;
  }

  const vectorLiteral = `[${embedding.join(",")}]`;
  const embeddingId = crypto.randomUUID();

  await db.$executeRaw(Prisma.sql`
    INSERT INTO "PageEmbedding" ("id", "organizationId", "pageId", "contentHash", "embedding", "createdAt", "updatedAt")
    VALUES (${embeddingId}, ${params.organizationId}, ${params.pageId}, ${contentHash}, ${vectorLiteral}::vector, NOW(), NOW())
    ON CONFLICT ("pageId") DO UPDATE SET
      "organizationId" = EXCLUDED."organizationId",
      "contentHash" = EXCLUDED."contentHash",
      "embedding" = EXCLUDED."embedding",
      "updatedAt" = NOW();
  `);
}

async function writeAuditLog(params: {
  organizationId: string;
  actorId?: string | null;
  action: "SPACE_CREATE" | "FOLDER_CREATE" | "PAGE_CREATE" | "PAGE_UPDATE" | "PAGE_RESTORE";
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.actorId ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      metadata: params.metadata ?? null,
    },
  });
}

export async function createSpace(formData: FormData) {
  const user = await requireUser();
  const membership = await requireRole("ADMIN");
  const organizationId = membership.organizationId;
  const parsed = spaceSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  const space = await db.space.create({
    data: {
      organizationId,
      name: parsed.name,
      slug: slugify(parsed.name),
      description: parsed.description,
    },
  });
  const [viewerRole, editorRole, adminRole] = await db.$transaction([
    db.spaceRole.create({
      data: {
        organizationId,
        spaceId: space.id,
        name: "Viewer",
        canView: true,
        canEdit: false,
        canDelete: false,
      },
    }),
    db.spaceRole.create({
      data: {
        organizationId,
        spaceId: space.id,
        name: "Editor",
        canView: true,
        canEdit: true,
        canDelete: false,
      },
    }),
    db.spaceRole.create({
      data: {
        organizationId,
        spaceId: space.id,
        name: "Admin",
        canView: true,
        canEdit: true,
        canDelete: true,
      },
    }),
  ]);

  await db.space.update({
    where: { id: space.id },
    data: { defaultRoleId: viewerRole.id },
  });
  await db.spaceRoleAssignment.create({
    data: {
      spaceId: space.id,
      userId: user.id,
      roleId: adminRole.id,
    },
  });

  await writeAuditLog({
    organizationId,
    actorId: user.id,
    action: "SPACE_CREATE",
    targetType: "space",
    targetId: space.id,
  });

  revalidatePath("/spaces");
}

export async function createFolder(formData: FormData) {
  const parsed = folderSchema.parse({
    name: formData.get("name"),
    spaceId: formData.get("spaceId"),
  });
  const { user, space } = await requireSpacePermission(parsed.spaceId, "edit");

  const folder = await db.folder.create({
    data: {
      organizationId: space.organizationId,
      spaceId: parsed.spaceId,
      name: parsed.name,
      slug: slugify(parsed.name),
    },
  });

  await writeAuditLog({
    organizationId,
    actorId: user.id,
    action: "FOLDER_CREATE",
    targetType: "folder",
    targetId: folder.id,
  });

  revalidatePath(`/spaces/${parsed.spaceId}`);
}

export async function createPage(formData: FormData) {
  const parsed = pageSchema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
    spaceId: formData.get("spaceId"),
    folderId: formData.get("folderId") || undefined,
  });
  const { user, space } = await requireSpacePermission(parsed.spaceId, "edit");

  if (parsed.folderId) {
    const folder = await db.folder.findFirst({
      where: {
        id: parsed.folderId,
        spaceId: parsed.spaceId,
      },
    });

    if (!folder) {
      throw new Error("Folder not found.");
    }
  }

  const page = await db.page.create({
    data: {
      organizationId: space.organizationId,
      spaceId: parsed.spaceId,
      folderId: parsed.folderId,
      title: parsed.title,
      slug: slugify(parsed.title),
      content: parsed.content,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  await db.pageRevision.create({
    data: {
      organizationId: space.organizationId,
      pageId: page.id,
      title: page.title,
      content: page.content,
      version: 1,
      createdById: user.id,
    },
  });

  await writeAuditLog({
    organizationId: space.organizationId,
    actorId: user.id,
    action: "PAGE_CREATE",
    targetType: "page",
    targetId: page.id,
  });

  await upsertPageEmbedding({
    organizationId: space.organizationId,
    pageId: page.id,
    title: page.title,
    content: page.content,
  });

  revalidatePath(`/spaces/${parsed.spaceId}`);
}

export async function updatePage(formData: FormData) {
  const user = await requireUser();
  const parsed = pageUpdateSchema.parse({
    pageId: formData.get("pageId"),
    title: formData.get("title"),
    content: formData.get("content"),
  });

  const existingPage = await db.page.findFirst({
    where: { id: parsed.pageId },
    select: { id: true, spaceId: true, organizationId: true },
  });

  if (!existingPage) {
    throw new Error("Page not found.");
  }
  const access = await getSpaceAccess(existingPage.spaceId, user.id);
  if (!access?.permissions.edit) {
    throw new Error("Insufficient permissions.");
  }

  const page = await db.page.update({
    where: { id: parsed.pageId },
    data: {
      title: parsed.title,
      slug: slugify(parsed.title),
      content: parsed.content,
      updatedById: user.id,
    },
  });

  const latestRevision = await db.pageRevision.findFirst({
    where: { pageId: parsed.pageId },
    orderBy: { version: "desc" },
  });

  const nextVersion = (latestRevision?.version ?? 0) + 1;

  await db.pageRevision.create({
    data: {
      organizationId: existingPage.organizationId,
      pageId: page.id,
      title: page.title,
      content: page.content,
      version: nextVersion,
      createdById: user.id,
    },
  });

  await writeAuditLog({
    organizationId: existingPage.organizationId,
    actorId: user.id,
    action: "PAGE_UPDATE",
    targetType: "page",
    targetId: page.id,
  });

  await upsertPageEmbedding({
    organizationId: existingPage.organizationId,
    pageId: page.id,
    title: page.title,
    content: page.content,
  });

  revalidatePath(`/spaces/${page.spaceId}/pages/${page.id}`);
}

export async function restorePageRevision(formData: FormData) {
  const user = await requireUser();
  const pageId = String(formData.get("pageId") ?? "");
  const revisionId = String(formData.get("revisionId") ?? "");

  if (!pageId || !revisionId) {
    throw new Error("Invalid revision.");
  }

  const revision = await db.pageRevision.findFirst({
    where: { id: revisionId, pageId },
    select: { id: true, title: true, content: true },
  });

  if (!revision) {
    throw new Error("Revision not found.");
  }

  const pageExists = await db.page.findFirst({
    where: { id: pageId },
    select: { id: true, spaceId: true, organizationId: true },
  });

  if (!pageExists) {
    throw new Error("Page not found.");
  }
  const access = await getSpaceAccess(pageExists.spaceId, user.id);
  if (!access?.permissions.edit) {
    throw new Error("Insufficient permissions.");
  }

  const latestRevision = await db.pageRevision.findFirst({
    where: { pageId },
    orderBy: { version: "desc" },
  });

  const nextVersion = (latestRevision?.version ?? 0) + 1;

  const page = await db.page.update({
    where: { id: pageExists.id },
    data: {
      title: revision.title,
      slug: slugify(revision.title),
      content: revision.content,
      updatedById: user.id,
    },
  });

  await db.pageRevision.create({
    data: {
      organizationId: pageExists.organizationId,
      pageId: page.id,
      title: page.title,
      content: page.content,
      version: nextVersion,
      createdById: user.id,
    },
  });

  await writeAuditLog({
    organizationId: pageExists.organizationId,
    actorId: user.id,
    action: "PAGE_RESTORE",
    targetType: "page",
    targetId: page.id,
    metadata: { revisionId },
  });

  revalidatePath(`/spaces/${page.spaceId}/pages/${page.id}`);
}

export async function updateSpaceVisibility(formData: FormData) {
  const membership = await requireRole("ADMIN");
  const spaceId = String(formData.get("spaceId") ?? "");
  const visibility = String(formData.get("visibility") ?? "");
  if (!spaceId) {
    throw new Error("Space is required.");
  }
  if (visibility !== "MEMBERS_ONLY" && visibility !== "PUBLIC") {
    throw new Error("Invalid visibility.");
  }

  const space = await db.space.findFirst({
    where: { id: spaceId, organizationId: membership.organizationId },
  });
  if (!space) {
    throw new Error("Space not found.");
  }

  await db.space.update({
    where: { id: spaceId },
    data: { visibility },
  });

  revalidatePath(`/spaces/${spaceId}`);
  revalidatePath("/spaces");
}

export async function updateSpaceDefaultRole(formData: FormData) {
  const membership = await requireRole("ADMIN");
  const spaceId = String(formData.get("spaceId") ?? "");
  const roleIdValue = String(formData.get("roleId") ?? "");

  if (!spaceId) {
    throw new Error("Space is required.");
  }

  const space = await db.space.findFirst({
    where: { id: spaceId, organizationId: membership.organizationId },
  });
  if (!space) {
    throw new Error("Space not found.");
  }

  let roleId: string | null = null;
  if (roleIdValue) {
    const role = await db.spaceRole.findFirst({
      where: { id: roleIdValue, spaceId, organizationId: membership.organizationId },
    });
    if (!role) {
      throw new Error("Role not found.");
    }
    roleId = role.id;
  }

  await db.space.update({
    where: { id: spaceId },
    data: { defaultRoleId: roleId },
  });

  revalidatePath(`/spaces/${spaceId}`);
  revalidatePath("/spaces");
}

export async function createSpaceRole(formData: FormData) {
  const membership = await requireRole("ADMIN");
  const spaceId = String(formData.get("spaceId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!spaceId || !name) {
    throw new Error("Role name is required.");
  }

  const space = await db.space.findFirst({
    where: { id: spaceId, organizationId: membership.organizationId },
  });
  if (!space) {
    throw new Error("Space not found.");
  }

  await db.spaceRole.create({
    data: {
      organizationId: membership.organizationId,
      spaceId,
      name,
      canView: parseCheckboxValue(formData.get("canView")),
      canEdit: parseCheckboxValue(formData.get("canEdit")),
      canDelete: parseCheckboxValue(formData.get("canDelete")),
    },
  });

  revalidatePath(`/spaces/${spaceId}`);
}

export async function updateSpaceRole(formData: FormData) {
  const membership = await requireRole("ADMIN");
  const roleId = String(formData.get("roleId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!roleId || !name) {
    throw new Error("Role is required.");
  }

  const role = await db.spaceRole.findFirst({
    where: { id: roleId, organizationId: membership.organizationId },
  });
  if (!role) {
    throw new Error("Role not found.");
  }

  await db.spaceRole.update({
    where: { id: roleId },
    data: {
      name,
      canView: parseCheckboxValue(formData.get("canView")),
      canEdit: parseCheckboxValue(formData.get("canEdit")),
      canDelete: parseCheckboxValue(formData.get("canDelete")),
    },
  });

  revalidatePath(`/spaces/${role.spaceId}`);
}

export async function deleteSpaceRole(formData: FormData) {
  const membership = await requireRole("ADMIN");
  const roleId = String(formData.get("roleId") ?? "");
  if (!roleId) {
    throw new Error("Role is required.");
  }

  const role = await db.spaceRole.findFirst({
    where: { id: roleId, organizationId: membership.organizationId },
  });
  if (!role) {
    throw new Error("Role not found.");
  }

  await db.space.updateMany({
    where: { defaultRoleId: roleId },
    data: { defaultRoleId: null },
  });

  await db.spaceRole.delete({ where: { id: roleId } });

  revalidatePath(`/spaces/${role.spaceId}`);
}

export async function assignSpaceRole(formData: FormData) {
  const membership = await requireRole("ADMIN");
  const spaceId = String(formData.get("spaceId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const roleId = String(formData.get("roleId") ?? "");

  if (!spaceId || !userId || !roleId) {
    throw new Error("Assignment requires a user and role.");
  }

  const [space, role, member] = await Promise.all([
    db.space.findFirst({
      where: { id: spaceId, organizationId: membership.organizationId },
    }),
    db.spaceRole.findFirst({
      where: { id: roleId, spaceId, organizationId: membership.organizationId },
    }),
    db.membership.findFirst({
      where: { userId, organizationId: membership.organizationId },
    }),
  ]);

  if (!space) {
    throw new Error("Space not found.");
  }
  if (!role) {
    throw new Error("Role not found.");
  }
  if (!member) {
    throw new Error("User is not a member of this organization.");
  }

  await db.spaceRoleAssignment.upsert({
    where: { spaceId_userId: { spaceId, userId } },
    update: { roleId },
    create: { spaceId, userId, roleId },
  });

  revalidatePath(`/spaces/${spaceId}`);
}

export async function removeSpaceRoleAssignment(formData: FormData) {
  const membership = await requireRole("ADMIN");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) {
    throw new Error("Assignment is required.");
  }

  const assignment = await db.spaceRoleAssignment.findFirst({
    where: { id: assignmentId },
    include: { space: true },
  });
  if (!assignment || assignment.space.organizationId !== membership.organizationId) {
    throw new Error("Assignment not found.");
  }

  await db.spaceRoleAssignment.delete({ where: { id: assignmentId } });

  revalidatePath(`/spaces/${assignment.spaceId}`);
}
