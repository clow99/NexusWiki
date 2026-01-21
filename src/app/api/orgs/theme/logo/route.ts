import crypto from "crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getS3Env } from "@/lib/env";
import { requireRole } from "@/lib/permissions";
import { getActiveMembership } from "@/lib/session";
import { buildOrgThemeKey, getS3Client } from "@/lib/s3";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const membership = await requireRole("ADMIN");
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Multipart form data is required." },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Logo must be 5MB or smaller." },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Logo must be an image." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = buildOrgThemeKey({
      organizationId: membership.organizationId,
      filename: file.name || "logo",
      suffix: crypto.randomUUID(),
    });

    const env = getS3Env();
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
        ContentDisposition: "inline",
      }),
    );

    const now = new Date();
    await db.organizationTheme.upsert({
      where: { organizationId: membership.organizationId },
      update: {
        logoKey: key,
        logoContentType: file.type || "application/octet-stream",
        logoUpdatedAt: now,
      },
      create: {
        organizationId: membership.organizationId,
        background: "default",
        accent: "blue",
        logoKey: key,
        logoContentType: file.type || "application/octet-stream",
        logoUpdatedAt: now,
      },
    });

    return NextResponse.json({
      logoUrl: `/api/orgs/theme/logo?v=${now.getTime()}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const membership = await getActiveMembership();
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const theme = await db.organizationTheme.findUnique({
    where: { organizationId: membership.organizationId },
  });
  if (!theme?.logoKey) {
    return NextResponse.json({ error: "Logo not found." }, { status: 404 });
  }

  const env = getS3Env();
  const signedUrl = await getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: theme.logoKey,
    }),
    { expiresIn: 600 },
  );

  return NextResponse.redirect(signedUrl);
}
