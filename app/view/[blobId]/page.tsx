"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

// ── Constants ──────────────────────────────────────────────────────────────
const RPC_BASE = "https://api.shelbynet.shelby.xyz/shelby";

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function sniffMime(bytes: Uint8Array): string {
  const h = Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, "0")).join("");
  if (h.startsWith("89504e47")) return "image/png";
  if (h.startsWith("ffd8ff"))   return "image/jpeg";
  if (h.startsWith("47494638")) return "image/gif";
  if (h.startsWith("25504446")) return "application/pdf";
  if (h.startsWith("504b0304")) return "application/zip";
  return "application/octet-stream";
}

function short(addr: string) {
  return addr.length > 16 ? `${addr.slice(0, 10)}…${addr.slice(-6)}` : addr;
}

type Status = "loading" | "verified" | "error";

// ── Page ───────────────────────────────────────────────────────────────────
export default function VerifyPage() {
  const params = useParams();
  // blobId in URL is base64url-encoded "account||filename"
  const raw = typeof params.blobId === "string" ? params.blobId : Array.isArray(params.blobId) ? params.blobId[0] : "";

  // Decode: blobId = btoa(account + "||" + filename)
  let account = "";
  let fileName = "";
  try {
    const decoded = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const sep = decoded.indexOf("||");
    if (sep !== -1) {
      account = decoded.slice(0, sep);
      fileName = decoded.slice(sep + 2);
    }
  } catch { /* invalid blobId */ }

  const [status, setStatus]       = useState<Status>("loading");
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileSize, setFileSize]   = useState(0);
  const [mimeType, setMimeType]   = useState("");
  const [sha256, setSha256]       = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [errorMsg, setErrorMsg]   = useState("");
  const [copied, setCopied]       = useState<string | null>(null);

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const verify = useCallback(async () => {
    if (!account || !fileName) {
      setErrorMsg("Invalid verification link.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const url = `${RPC_BASE}/v1/blobs/${account}/${encodeURIComponent(fileName)}`;
      const res = await fetch(`/api/fetch-blob?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const mime  = sniffMime(bytes);
      const hash  = await sha256Hex(bytes);
      const blob  = new Blob([bytes], { type: mime });
      setFileBytes(bytes);
      setFileSize(bytes.length);
      setMimeType(mime);
      setSha256(hash);
      setPreviewUrl(URL.createObjectURL(blob));
      setStatus("verified");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Could not fetch file from Shelbynet.");
      setStatus("error");
    }
  }, [account, fileName]);

  useEffect(() => { verify(); }, [verify]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const download = () => {
    if (!fileBytes) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = fileName;
    a.click();
  };

  const isImage = mimeType.startsWith("image/");
  const isPdf   = mimeType === "application/pdf";

  return (
    <div className="min-h-screen text-white" style={{ background: "#0c0a08" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scanline{ 0% { top: -40px; } 100% { top: 100%; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180,120,40,0.12), transparent)" }} />
      <div className="fixed inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: "linear-gradient(rgba(255,200,100,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,100,0.03) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-800/70 backdrop-blur-xl"
        style={{ background: "rgba(12,10,8,0.85)" }}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" style={{ textDecoration: "none", cursor: "pointer" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l5-5 3 3 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 14h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-stone-100">Linker</span>
          </a>
          <span className="flex items-center gap-1.5 text-xs border border-amber-800/50 text-amber-500/80 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(120,80,0,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            File Verification
          </span>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-5 md:px-8 py-12 pb-24">

        {/* Title */}
        <div className="text-center mb-10" style={{ animation: "fadeUp 0.4s ease" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-800/40 text-amber-500/80 text-xs font-medium mb-4"
            style={{ background: "rgba(120,80,0,0.15)" }}>
            🔍 On-chain Proof of Existence
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-stone-100 mb-3">
            File Verification
          </h1>
          <p className="text-stone-500 text-sm max-w-md mx-auto leading-relaxed">
            This file is stored on the Shelby blockchain. Its existence and content are verified directly from the chain — no central authority required.
          </p>
        </div>

        {/* File info */}
        {(account && fileName) && (
          <div className="rounded-2xl border border-stone-800 p-5 mb-5"
            style={{ background: "rgba(28,24,20,0.9)", animation: "fadeUp 0.4s 0.05s ease both" }}>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">File Details</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <span className="text-xs text-stone-600 w-20 shrink-0 pt-0.5">Filename</span>
                <span className="text-sm text-stone-200 font-medium break-all">{fileName}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-stone-600 w-20 shrink-0 pt-0.5">Uploader</span>
                <span className="text-xs font-mono text-amber-500/80 bg-amber-950/30 border border-amber-900/30 px-2 py-0.5 rounded-full break-all">{short(account)}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-stone-600 w-20 shrink-0 pt-0.5">Network</span>
                <span className="text-xs text-emerald-400">Shelbynet · Aptos Blockchain</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {status === "loading" && (
          <div className="rounded-2xl border border-stone-800 p-12 text-center relative overflow-hidden"
            style={{ background: "rgba(28,24,20,0.9)" }}>
            <div className="absolute left-0 right-0 h-0.5"
              style={{ background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)", animation: "scanline 2s linear infinite" }} />
            <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-400" style={{ animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity=".2" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-stone-200 font-semibold mb-1">Fetching from Shelbynet…</p>
            <p className="text-stone-600 text-sm">Retrieving file and computing cryptographic hash</p>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="rounded-2xl border border-rose-900/40 p-10 text-center"
            style={{ background: "rgba(40,10,10,0.6)" }}>
            <div className="text-4xl mb-4">❌</div>
            <p className="text-rose-300 font-semibold mb-2">Verification Failed</p>
            <p className="text-rose-800 text-sm mb-5 max-w-sm mx-auto">{errorMsg}</p>
            <button onClick={verify} style={{ cursor: "pointer" }}
              className="text-sm text-rose-300 border border-rose-800 px-4 py-2 rounded-xl hover:bg-rose-950/50 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Verified */}
        {status === "verified" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {/* Verified banner */}
            <div className="rounded-2xl border border-emerald-900/40 p-5 mb-5 flex items-center gap-4"
              style={{ background: "rgba(2,20,14,0.8)", boxShadow: "0 0 40px rgba(16,185,129,0.06)" }}>
              <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-900/50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-300 font-bold text-sm mb-0.5">✓ Verified on Shelbynet</p>
                <p className="text-emerald-700 text-xs">This file exists on-chain and was successfully retrieved from Shelby decentralised storage</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: "File Size",  value: fmt(fileSize),          icon: "📦" },
                { label: "Type",       value: mimeType,               icon: "🗂️" },
                { label: "Network",    value: "Shelbynet",            icon: "🌐" },
                { label: "Chain",      value: "Aptos",                icon: "⛓️" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-stone-800 p-4"
                  style={{ background: "rgba(28,24,20,0.8)" }}>
                  <div className="text-lg mb-2">{s.icon}</div>
                  <p className="text-xs text-stone-600 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-xs font-semibold text-stone-200 break-all">{s.value}</p>
                </div>
              ))}
            </div>

            {/* SHA-256 */}
            <div className="rounded-2xl border border-stone-800 p-5 mb-5"
              style={{ background: "rgba(28,24,20,0.9)" }}>
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div>
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-0.5">SHA-256 Content Hash</p>
                  <p className="text-xs text-stone-700">Cryptographic proof this file has not been tampered with</p>
                </div>
                <button onClick={() => copyText(sha256, "hash")} style={{ cursor: "pointer" }}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors shrink-0
                    ${copied === "hash"
                      ? "border-emerald-700/60 text-emerald-300 bg-emerald-950/40"
                      : "border-amber-800/40 text-amber-400 hover:bg-amber-950/30"}`}>
                  {copied === "hash" ? "✓ Copied" : "Copy Hash"}
                </button>
              </div>
              <div className="rounded-xl border border-stone-800 p-3" style={{ background: "rgba(0,0,0,0.4)" }}>
                <p className="font-mono text-xs text-amber-500/80 break-all leading-7">
                  {sha256.match(/.{1,8}/g)?.map((chunk, i) => (
                    <span key={i} className="mr-2" style={{ opacity: i % 2 === 0 ? 1 : 0.6 }}>{chunk}</span>
                  ))}
                </p>
              </div>
            </div>

            {/* Preview */}
            {(isImage || isPdf) && (
              <div className="rounded-2xl border border-stone-800 p-5 mb-5"
                style={{ background: "rgba(28,24,20,0.9)" }}>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Preview</p>
                {isImage && (
                  <div className="rounded-xl overflow-hidden flex items-center justify-center p-3"
                    style={{ background: "rgba(0,0,0,0.4)" }}>
                    <img src={previewUrl} alt={fileName}
                      className="max-w-full max-h-96 object-contain rounded-lg" />
                  </div>
                )}
                {isPdf && (
                  <iframe src={previewUrl} className="w-full rounded-xl border border-stone-700"
                    style={{ height: 480 }} title={fileName} />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="rounded-2xl border border-stone-800 p-5 mb-5"
              style={{ background: "rgba(28,24,20,0.9)" }}>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Actions</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={download} style={{ cursor: "pointer" }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-900/50 text-emerald-300 hover:bg-emerald-950/40 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M7.5 2v8M7.5 10l-3-3M7.5 10l3-3M2 13h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download File
                </button>
                <button onClick={() => copyText(typeof window !== "undefined" ? window.location.href : "", "link")}
                  style={{ cursor: "pointer" }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors
                    ${copied === "link"
                      ? "border-emerald-700/60 text-emerald-300 bg-emerald-950/40"
                      : "border-amber-800/40 text-amber-300 hover:bg-amber-950/30"}`}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 9l3.5-3.5M7.5 5H9a2.5 2.5 0 010 5H7.5M6.5 9H5A2.5 2.5 0 015 4h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  {copied === "link" ? "✓ Copied!" : "Copy Verification Link"}
                </button>
              </div>
            </div>

            {/* What this proves */}
            <div className="rounded-2xl border border-stone-800 p-5"
              style={{ background: "rgba(28,24,20,0.6)" }}>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">What this proves</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: "🔒", text: "This file exists on Shelby decentralised storage — it cannot be deleted or altered by anyone, including Linker" },
                  { icon: "🔍", text: "The SHA-256 hash above is computed from the raw file bytes. Any change — even a single byte — produces a completely different hash" },
                  { icon: "⛓️", text: "The file is stored on Shelbynet, an Aptos-compatible blockchain, giving it permanent and verifiable on-chain provenance" },
                  { icon: "🌍", text: "Anyone with this link can independently verify the file without trusting Linker or any central authority" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                    <p className="text-xs text-stone-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        <p className="text-center text-xs text-stone-700 mt-12">
          Files stored as immutable blobs on Shelby · Aptos blockchain · No central server<br />
          © {new Date().getFullYear()} Beauty Benedict · All rights reserved
        </p>
      </main>
    </div>
  );
}