import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@nexuswiki.local";

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Nexus Admin",
      emailVerified: new Date(),
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme",
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: { role: "ADMIN" },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: "ADMIN",
    },
  });

  const space = await prisma.space.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "general",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: "General",
      slug: "general",
      description: "Company-wide documentation.",
    },
  });

  const folder = await prisma.folder.upsert({
    where: {
      spaceId_slug: {
        spaceId: space.id,
        slug: "getting-started",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      spaceId: space.id,
      name: "Getting Started",
      slug: "getting-started",
    },
  });

  const page = await prisma.page.upsert({
    where: {
      spaceId_slug: {
        spaceId: space.id,
        slug: "welcome",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      spaceId: space.id,
      folderId: folder.id,
      title: "Welcome to Nexus Wiki",
      slug: "welcome",
      content:
        "# Welcome\n\nThis is your internal wiki. Use markdown to capture policies, playbooks, and onboarding docs.",
      createdById: user.id,
      updatedById: user.id,
    },
  });

  await prisma.pageRevision.create({
    data: {
      organizationId: organization.id,
      pageId: page.id,
      title: page.title,
      content: page.content,
      version: 1,
      createdById: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      actorId: user.id,
      action: "ORG_CREATE",
      targetType: "organization",
      targetId: organization.id,
      metadata: { seed: true },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
