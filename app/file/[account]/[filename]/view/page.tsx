// PATH: app/file/[account]/[filename]/view/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import FilePreviewClient from "./FilePreviewClient";

const RPC_BASE = "https://api.shelbynet.shelby.xyz/shelby";
const API_KEY = process.env.SHELBY_API_KEY!;

interface Props {
  params: Promise<{ account: string; filename: string }>;
}

function decodeFilename(encoded: string): string {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "==".slice(0, (4 - base64.length % 4) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return decodeURIComponent(encoded);
  }
}

async function getFileMeta(account: string, fileName: string) {
  const url = `${RPC_BASE}/v1/blobs/${account}/${encodeURIComponent(fileName)}`;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return {
      contentType: res.headers.get("content-type") ?? "application/octet-stream",
      contentLength: res.headers.get("content-length"),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { filename } = await params;
  const name = decodeFilename(filename);
  return {
    title: `${name} — Linker`,
    description: `Download ${name} shared via Linker on Shelby decentralized storage`,
  };
}

export default async function FilePreviewPage({ params }: Props) {
  const { account: rawAccount, filename } = await params;
  const account = rawAccount.startsWith("0x") ? rawAccount : `0x${rawAccount}`;
  const fileName = decodeFilename(filename);
  const meta = await getFileMeta(account, fileName);
  if (!meta) notFound();

  // downloadUrl uses the same base64 encoded filename
  const downloadUrl = `/file/${account}/${filename}`;

  return (
    <FilePreviewClient
      fileName={fileName}
      contentType={meta.contentType}
      contentLength={meta.contentLength}
      downloadUrl={downloadUrl}
      account={account}
    />
  );
}