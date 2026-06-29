import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.SHELBY_API_KEY!;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Fetch failed", status: res.status }, { status: res.status });
    }
    const body = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    return new NextResponse(body, {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}