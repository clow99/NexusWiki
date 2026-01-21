import crypto from "crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { db } from "@/lib/db";
import { getS3Env } from "@/lib/env";
import { getS3Client, buildAssetKey } from "@/lib/s3";
import { requireSpacePermission, getSpaceAccess } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/octet-stream",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const uploadSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  spaceId: z.string().min(1),
  pageId: z.string().min(1).optional(),
  kind: z.enum(["image", "document"]),
});

function sanitizeFilename(filename: string) {
  return filename.replace(/[^\w.\-]+/g, "_");
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");
    let payload: z.infer<typeof uploadSchema> | null = null;
    let fileBuffer: Buffer | null = null;

    if (isMultipart) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "File is required." }, { status: 400 });
      }

      const pageIdValue = formData.get("pageId");
      const pageId =
        typeof pageIdValue === "string" && pageIdValue.trim().length > 0
          ? pageIdValue
          : undefined;
      payload = uploadSchema.parse({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        spaceId: formData.get("spaceId"),
        pageId,
        kind: formData.get("kind"),
      });
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      payload = uploadSchema.parse(await request.json());
    }

    const isImage = payload.kind === "image";
    if (isImage && !payload.contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are allowed for image assets." },
        { status: 400 },
      );
    }
    if (!isImage && !ALLOWED_DOCUMENT_TYPES.has(payload.contentType)) {
      return NextResponse.json(
        { error: "Unsupported document type." },
        { status: 400 },
      );
    }
    const { user, space } = await requireSpacePermission(payload.spaceId, "edit");

    if (payload.pageId) {
      const page = await db.page.findFirst({
        where: {
          id: payload.pageId,
          spaceId: payload.spaceId,
        },
      });
      if (!page) {
        return NextResponse.json({ error: "Page not found." }, { status: 404 });
      }
    }

    const safeFilename = sanitizeFilename(payload.filename);
    const key = buildAssetKey({
      organizationId: space.organizationId,
      spaceId: payload.spaceId,
      filename: safeFilename,
      suffix: crypto.randomUUID(),
    });

    const asset = await db.asset.create({
      data: {
        organizationId: space.organizationId,
        spaceId: payload.spaceId,
        pageId: payload.pageId,
        uploadedById: user.id,
        filename: payload.filename,
        key,
        contentType: payload.contentType,
        size: payload.size,
        isImage,
      },
    });

    const env = getS3Env();
    const contentDisposition = isImage
      ? "inline"
      : `attachment; filename="${safeFilename}"`;

    const publicBaseUrl = env.AWS_S3_PUBLIC_BASE_URL?.replace(/\/+$/g, "");
    const assetUrl = `/api/uploads/${asset.id}`;
    if (fileBuffer) {
      await getS3Client().send(
        new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key,
          Body: fileBuffer,
          ContentType: payload.contentType,
          ContentDisposition: contentDisposition,
        }),
      );

      return NextResponse.json({
        assetUrl,
        publicUrl: publicBaseUrl ? `${publicBaseUrl}/${key}` : null,
        assetId: asset.id,
      });
    }

    const uploadUrl = await getSignedUrl(
      getS3Client(),
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        ContentType: payload.contentType,
        ContentLength: payload.size,
        ContentDisposition: contentDisposition,
      }),
      { expiresIn: 600 },
    );

    return NextResponse.json({
      uploadUrl,
      assetUrl,
      publicUrl: publicBaseUrl ? `${publicBaseUrl}/${key}` : null,
      assetId: asset.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");
  const keyParam = searchParams.get("key");
  let key = keyParam?.trim() ?? "";

  if (!key) {
    const value = source?.trim();
    if (!value) {
      return NextResponse.json({ error: "Missing key." }, { status: 400 });
    }
    try {
      const parsed = new URL(value);
      key = parsed.pathname.replace(/^\/+/, "");
    } catch {
      key = value.replace(/^\/+/, "");
    }
  }

  const asset = await db.asset.findFirst({
    where: {
      key,
    },
  });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }
  const access = await getSpaceAccess(asset.spaceId, user?.id ?? null);
  if (!access?.permissions.view) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const env = getS3Env();
  const signedUrl = await getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: asset.key,
    }),
    { expiresIn: 600 },
  );

  return NextResponse.redirect(signedUrl);
}
