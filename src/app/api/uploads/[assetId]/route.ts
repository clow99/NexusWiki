import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { db } from "@/lib/db";
import { getS3Client } from "@/lib/s3";
import { getS3Env } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { getSpaceAccess } from "@/lib/permissions";

type RouteParams = {
  params: Promise<{ assetId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { assetId } = await params;
  const user = await getCurrentUser();

  const asset = await db.asset.findFirst({
    where: {
      id: assetId,
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
