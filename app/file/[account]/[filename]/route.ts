import { NextRequest, NextResponse } from "next/server";

const RPC_BASE = "https://api.shelbynet.shelby.xyz/shelby";
const API_KEY = "AG-PG2RND4MMYKIYDF3NFV2HRB3YK1I1NERL";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ account: string; filename: string }> }
) {
  // In Next.js 15/16, params is a Promise — must be awaited
  const { account: rawAccount, filename } = await context.params;
  const account = rawAccount.startsWith("0x") ? rawAccount : `0x${rawAccount}`;

  const shelbyUrl = `${RPC_BASE}/v1/blobs/${account}/${decodeURIComponent(filename)}`;

  try {
    const res = await fetch(shelbyUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "File not found or expired", detail: body },
        { status: res.status }
      );
    }

    const contentType =
      res.headers.get("content-type") ?? "application/octet-stream";

    // Inline for images/PDF so browser displays them; attachment for everything else
    const isInline = contentType.startsWith("image/") || contentType === "application/pdf";
    const disposition = isInline
      ? `inline; filename="${decodeURIComponent(filename)}"`
      : `attachment; filename="${decodeURIComponent(filename)}"`;

    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}