import { NextRequest, NextResponse } from "next/server";
import { getStorageSignedUrl } from "@/lib/supabase-storage";

type Params = { params: Promise<{ fileKey: string[] }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { fileKey: segments } = await params;
  const fileKey = decodeURIComponent(segments.join("/"));

  try {
    const url = await getStorageSignedUrl(fileKey);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
