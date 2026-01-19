"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { requireRole } from "@/lib/permissions";

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
  const user = await requireUser();
  const membership = await requireRole("EDITOR");
  const organizationId = membership.organizationId;
  const parsed = folderSchema.parse({
    name: formData.get("name"),
    spaceId: formData.get("spaceId"),
  });

  const space = await db.space.findFirst({
    where: { id: parsed.spaceId, organizationId },
  });

  if (!space) {
    throw new Error("Space not found.");
  }

  const folder = await db.folder.create({
    data: {
      organizationId,
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
  const user = await requireUser();
  const membership = await requireRole("EDITOR");
  const organizationId = membership.organizationId;
  const parsed = pageSchema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
    spaceId: formData.get("spaceId"),
    folderId: formData.get("folderId") || undefined,
  });

  const space = await db.space.findFirst({
    where: { id: parsed.spaceId, organizationId },
  });

  if (!space) {
    throw new Error("Space not found.");
  }

  if (parsed.folderId) {
    const folder = await db.folder.findFirst({
      where: {
        id: parsed.folderId,
        spaceId: parsed.spaceId,
        organizationId,
      },
    });

    if (!folder) {
      throw new Error("Folder not found.");
    }
  }

  const page = await db.page.create({
    data: {
      organizationId,
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
      organizationId,
      pageId: page.id,
      title: page.title,
      content: page.content,
      version: 1,
      createdById: user.id,
    },
  });

  await writeAuditLog({
    organizationId,
    actorId: user.id,
    action: "PAGE_CREATE",
    targetType: "page",
    targetId: page.id,
  });

  revalidatePath(`/spaces/${parsed.spaceId}`);
}

export async function updatePage(formData: FormData) {
  const user = await requireUser();
  const membership = await requireRole("EDITOR");
  const organizationId = membership.organizationId;
  const parsed = pageUpdateSchema.parse({
    pageId: formData.get("pageId"),
    title: formData.get("title"),
    content: formData.get("content"),
  });

  const existingPage = await db.page.findFirst({
    where: { id: parsed.pageId, organizationId },
  });

  if (!existingPage) {
    throw new Error("Page not found.");
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
      organizationId,
      pageId: page.id,
      title: page.title,
      content: page.content,
      version: nextVersion,
      createdById: user.id,
    },
  });

  await writeAuditLog({
    organizationId,
    actorId: user.id,
    action: "PAGE_UPDATE",
    targetType: "page",
    targetId: page.id,
  });

  revalidatePath(`/spaces/${page.spaceId}/pages/${page.id}`);
}

export async function restorePageRevision(formData: FormData) {
  const user = await requireUser();
  const membership = await requireRole("EDITOR");
  const organizationId = membership.organizationId;
  const pageId = String(formData.get("pageId") ?? "");
  const revisionId = String(formData.get("revisionId") ?? "");

  if (!pageId || !revisionId) {
    throw new Error("Invalid revision.");
  }

  const revision = await db.pageRevision.findFirst({
    where: { id: revisionId, pageId, organizationId },
  });

  if (!revision) {
    throw new Error("Revision not found.");
  }

  const pageExists = await db.page.findFirst({
    where: { id: pageId, organizationId },
  });

  if (!pageExists) {
    throw new Error("Page not found.");
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
      organizationId,
      pageId: page.id,
      title: page.title,
      content: page.content,
      version: nextVersion,
      createdById: user.id,
    },
  });

  await writeAuditLog({
    organizationId,
    actorId: user.id,
    action: "PAGE_RESTORE",
    targetType: "page",
    targetId: page.id,
    metadata: { revisionId },
  });

  revalidatePath(`/spaces/${page.spaceId}/pages/${page.id}`);
}
