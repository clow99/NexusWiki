import { S3Client } from "@aws-sdk/client-s3";

import { getS3Env } from "@/lib/env";

let cachedClient: S3Client | null = null;

export function getS3Client() {
  if (!cachedClient) {
    const env = getS3Env();
    cachedClient = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  return cachedClient;
}

export function buildAssetKey(params: {
  organizationId: string;
  spaceId: string;
  filename: string;
  suffix: string;
}) {
  const env = getS3Env();
  const prefix = env.AWS_S3_PREFIX?.trim().replace(/\/+$/g, "") || "uploads";
  const safeFilename = params.filename.replace(/[^\w.\-]+/g, "_");
  return `${prefix}/${params.organizationId}/${params.spaceId}/${params.suffix}-${safeFilename}`;
}

export function buildOrgThemeKey(params: {
  organizationId: string;
  filename: string;
  suffix: string;
}) {
  const env = getS3Env();
  const prefix = env.AWS_S3_PREFIX?.trim().replace(/\/+$/g, "") || "uploads";
  const safeFilename = params.filename.replace(/[^\w.\-]+/g, "_");
  return `${prefix}/${params.organizationId}/org-theme/${params.suffix}-${safeFilename}`;
}
