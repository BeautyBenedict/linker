import { Metadata } from "next";
import { notFound } from "next/navigation";
import FilePreviewClient from "./FilePreviewClient";

const RPC_BASE = "https://api.shelbynet.shelby.xyz/shelby";
const API_KEY = "AG-PG2RND4MMYKIYDF3NFV2HRB3YK1I1NERL";

interface Props {
  params: Promise<{ account: string; filename: string }>;
}

async function getFileMeta(account: string, filename: string) {
  const url = `${RPC_BASE}/v1/blobs/${account}/${decodeURIComponent(filename)}`;
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
  const name = decodeURIComponent(filename);
  return {
    title: `${name} — Linker`,
    description: `Download ${name} shared via Linker on Shelby decentralized storage`,
  };
}

export default async function FilePreviewPage({ params }: Props) {
  const { account: rawAccount, filename } = await params;
  const account = rawAccount.startsWith("0x") ? rawAccount : `0x${rawAccount}`;
  const decodedName = decodeURIComponent(filename);

  const meta = await getFileMeta(account, filename);
  if (!meta) notFound();

  const downloadUrl = `/file/${account}/${filename}`;

  return (
    <FilePreviewClient
      fileName={decodedName}
      contentType={meta.contentType}
      contentLength={meta.contentLength}
      downloadUrl={downloadUrl}
      account={account}
    />
  );
}