// PATH: app/file/[account]/[filename]/route.ts
import { NextRequest, NextResponse } from "next/server";

const RPC_BASE = "https://api.shelbynet.shelby.xyz/shelby";
const API_KEY = process.env.SHELBY_API_KEY!;

function decodeFilename(encoded: string): string {
  try {
    // Try base64url decode first
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "==".slice(0, (4 - base64.length % 4) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    // Fallback: treat as regular URL-encoded filename
    return decodeURIComponent(encoded);
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ account: string; filename: string }> }
) {
  const { account: rawAccount, filename } = await context.params;
  const account = rawAccount.startsWith("0x") ? rawAccount : `0x${rawAccount}`;
  const fileName = decodeFilename(filename);

  const shelbyUrl = `${RPC_BASE}/v1/blobs/${account}/${encodeURIComponent(fileName)}`;

  try {
    const res = await fetch(shelbyUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json({ error: "File not found", detail: body }, { status: res.status });
    }
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const isInline = contentType.startsWith("image/") || contentType === "application/pdf";
    const disposition = isInline
      ? `inline; filename="${fileName}"`
      : `attachment; filename="${fileName}"`;
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}