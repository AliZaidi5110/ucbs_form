import { NextRequest, NextResponse } from "next/server";
import { getS3SignedUrl, isS3Configured } from "@/lib/s3";
import { verifySignedToken } from "@/lib/rate-limit";

type Params = { params: Promise<{ fileKey: string[] }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { fileKey: segments } = await params;
  const fileKey = decodeURIComponent(segments.join("/"));
  const token = req.nextUrl.searchParams.get("token");

  if (isS3Configured() && fileKey.startsWith("onboarding/")) {
    try {
      const url = await getS3SignedUrl(fileKey);
      return NextResponse.redirect(url);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  if (!token || !verifySignedToken(token, fileKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(
    { error: "Local file storage is no longer supported. Configure AWS S3." },
    { status: 410 }
  );
}
