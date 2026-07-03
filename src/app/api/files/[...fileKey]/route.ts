import { NextRequest, NextResponse } from "next/server";
import { verifySignedToken } from "@/lib/rate-limit";
import { getUploadedFile } from "@/lib/storage";

type Params = { params: Promise<{ fileKey: string[] }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { fileKey } = await params;
  const key = decodeURIComponent(fileKey.join("/"));
  const token = req.nextUrl.searchParams.get("token");

  if (!token || !verifySignedToken(token, key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const file = await getUploadedFile(key);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
