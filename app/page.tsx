"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useAccountBlobs, useUploadBlobs, useDeleteBlobs } from "@shelby-protocol/react";
import { getBlobNameSuffix } from "@shelby-protocol/sdk/browser";
import type { BlobMetadata } from "@shelby-protocol/sdk/browser";

// ── Constants ──────────────────────────────────────────────────────────────
const RPC_BASE = "https://api.shelbynet.shelby.xyz/shelby";
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}
function fmtDate(micros: number) {
  return new Date(micros / 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
function short(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

// blob.name is "@0xADDRESS/filename.ext" — split into account + filename
function parseBlobName(fullName: string): { account: string; fileName: string } {
  const withoutAt = fullName.startsWith("@") ? fullName.slice(1) : fullName;
  const slashIdx = withoutAt.indexOf("/");
  if (slashIdx === -1) return { account: withoutAt, fileName: withoutAt };
  const account = withoutAt.slice(0, slashIdx);
  // Always ensure 0x prefix on account address
  const accountWithPrefix = account.startsWith("0x") ? account : `0x${account}`;
  return { account: accountWithPrefix, fileName: withoutAt.slice(slashIdx + 1) };
}

// Internal RPC fetch URL — needs API key header
function rpcUrl(fullName: string): string {
  const { account, fileName } = parseBlobName(fullName);
  return `${RPC_BASE}/v1/blobs/${account}/${encodeURIComponent(fileName)}`;
}

// Clean shareable link — encodes account+filename into a short base64 token
// Result looks like: http://localhost:3000/file/0xABC123/photo.jpg
// The route.ts proxy fetches it server-side with the API key so no auth needed by recipient
// Share link opens the preview page — recipient sees file info + preview before downloading
function shareableUrl(fullName: string): string {
  const { account, fileName } = parseBlobName(fullName);
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/file/${account}/${encodeURIComponent(fileName)}/view`;
}

function extIcon(name: string) {
  const e = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png","jpg","jpeg","gif","svg","webp"].includes(e)) return "🖼";
  if (["mp4","mov","webm","avi"].includes(e)) return "🎬";
  if (["mp3","wav","ogg","flac"].includes(e)) return "🎵";
  if (["zip","tar","gz","rar"].includes(e)) return "📦";
  if (["pdf"].includes(e)) return "📄";
  if (["doc","docx"].includes(e)) return "📝";
  if (["xls","xlsx","csv"].includes(e)) return "📊";
  if (["ppt","pptx"].includes(e)) return "📊";
  if (["ts","tsx","js","jsx","json"].includes(e)) return "💻";
  if (["txt","md"].includes(e)) return "📝";
  return "📁";
}

type Kind = "success" | "error" | "info";
interface T { id: number; msg: string; kind: Kind }

// ── Toast ──────────────────────────────────────────────────────────────────
function ToastEl({ t, rm }: { t: T; rm: () => void }) {
  useEffect(() => { const id = setTimeout(rm, 4000); return () => clearTimeout(id); }, [rm]);
  const styles: Record<Kind, string> = {
    success: "bg-emerald-950 border-emerald-700/60 text-emerald-200",
    error:   "bg-rose-950 border-rose-700/60 text-rose-200",
    info:    "bg-stone-900 border-stone-600/60 text-stone-200",
  };
  const icons: Record<Kind, string> = { success: "✓", error: "✕", info: "·" };
  return (
    <div onClick={rm} style={{ animation: "toastIn 0.35s cubic-bezier(0.16,1,0.3,1)" }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl cursor-pointer text-sm font-medium select-none ${styles[t.kind]}`}>
      <span className="text-base leading-none shrink-0">{icons[t.kind]}</span>
      {t.msg}
    </div>
  );
}

// ── Wallet Button ──────────────────────────────────────────────────────────
function WalletBtn({ toast }: { toast: (m: string, k: Kind) => void }) {
  const { connect, disconnect, account, connected, wallets } = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  if (connected && account) return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} style={{ cursor: "pointer" }}
        className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-amber-800/50 bg-amber-950/40 hover:bg-amber-900/40 transition-colors text-sm font-medium text-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        {short(account.address.toString())}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-stone-700 bg-stone-950 shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-800">
            <p className="text-xs text-stone-500 mb-0.5">Connected · Shelbynet</p>
            <p className="text-sm font-mono text-stone-200 truncate">{short(account.address.toString())}</p>
          </div>
          <button onClick={() => { disconnect(); setOpen(false); toast("Wallet disconnected", "info"); }}
            style={{ cursor: "pointer" }}
            className="w-full px-4 py-3 text-sm text-left text-rose-400 hover:bg-rose-950/60 transition-colors">
            Disconnect wallet
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} disabled={connecting}
        style={{ cursor: connecting ? "wait" : "pointer" }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-stone-950 disabled:opacity-50 transition-all shadow-lg shadow-amber-900/40">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4 4V3a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="7" cy="8.5" r="1.2" fill="currentColor" />
        </svg>
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-700 bg-stone-950 shadow-2xl z-50 overflow-hidden">
          <p className="px-4 py-3 text-xs text-stone-500 border-b border-stone-800">Select a wallet</p>
          {wallets?.filter(w => w.name === "Petra").length ? (
            wallets.filter(w => w.name === "Petra").map(w => (
              <button key={w.name} onClick={() => { connect(w.name); setOpen(false); }}
                style={{ cursor: "pointer" }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-800/80 transition-colors text-sm text-stone-200">
                {w.icon && <img src={w.icon} alt={w.name} className="w-6 h-6 rounded-lg" />}
                {w.name}
              </button>
            ))
          ) : (
            <p className="px-4 py-4 text-xs text-stone-500">
              Petra not found.{" "}
              <a href="https://petra.app" target="_blank" rel="noopener noreferrer"
                style={{ cursor: "pointer" }} className="text-amber-400 underline">Install Petra →</a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Drop Zone ──────────────────────────────────────────────────────────────
function DropZone({ onFiles, uploading, names, connected }: {
  onFiles: (f: File[]) => void; uploading: boolean; names: string[]; connected: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const inp = useRef<HTMLInputElement>(null);
  return (
    <div
      onDrop={e => { e.preventDefault(); setDrag(false); const f = Array.from(e.dataTransfer.files); if (f.length) onFiles(f); }}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onClick={() => !uploading && connected && inp.current?.click()}
      style={{ cursor: !connected || uploading ? "not-allowed" : "pointer" }}
      className={`relative rounded-3xl border-2 border-dashed p-14 text-center transition-all duration-300 select-none
        ${drag ? "border-amber-500 bg-amber-950/20 scale-[1.01]" : "border-stone-700 hover:border-stone-500 bg-stone-900/30"}
        ${(!connected || uploading) ? "opacity-60" : ""}`}>
      <input ref={inp} type="file" multiple className="hidden"
        onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) onFiles(f); e.target.value = ""; }}
        disabled={!connected || uploading} />
      {uploading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-stone-700" />
            <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-xl">⛓</div>
          </div>
          <div>
            <p className="text-amber-300 font-bold text-lg">Writing to Shelby blockchain…</p>
            <p className="text-stone-500 text-sm mt-1">Approve the transaction in Petra to continue</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-3 max-w-xs mx-auto">
              {names.slice(0, 3).map(n => (
                <span key={n} className="text-xs bg-amber-950/60 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded-full truncate max-w-[160px]">{n}</span>
              ))}
              {names.length > 3 && <span className="text-xs text-stone-500">+{names.length - 3} more</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className={`w-18 h-18 rounded-3xl flex items-center justify-center text-3xl p-5 transition-all duration-300 ${drag ? "bg-amber-900/40 scale-110" : "bg-stone-800"}`}>
            {drag ? "⬇️" : "📤"}
          </div>
          <div>
            <p className={`text-xl font-bold transition-colors ${drag ? "text-amber-300" : "text-stone-200"}`}>
              {drag ? "Release to upload" : "Drop files here"}
            </p>
            <p className="text-stone-500 text-sm mt-2 max-w-xs mx-auto">
              {connected
                ? "Images, PDFs, docs, videos — any file type · max 4.5 MB on testnet"
                : "Connect your Petra wallet first"}
            </p>
          </div>
          {connected && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-800 border border-stone-700 text-xs text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Each upload is a signed Shelbynet transaction
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────
function DeleteModal({ fileName, onConfirm, onCancel, deleting }: {
  fileName: string; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-3xl border border-stone-700 bg-stone-950 p-6 shadow-2xl"
        style={{ animation: "fadeUp 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-900/60 flex items-center justify-center text-xl mb-4">🗑</div>
        <h3 className="text-lg font-bold text-stone-100 mb-1">Delete file?</h3>
        <p className="text-stone-500 text-sm mb-1">This will remove the file from the Shelby blockchain permanently via a signed transaction.</p>
        <p className="text-amber-400/80 text-xs font-mono truncate mb-6 bg-stone-900 px-3 py-2 rounded-xl border border-stone-800">{fileName}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting} style={{ cursor: "pointer" }}
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting} style={{ cursor: deleting ? "wait" : "pointer" }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white transition-colors text-sm font-semibold flex items-center justify-center gap-2">
            {deleting ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" className="opacity-25"/><path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-90"/></svg> Signing…</>
            ) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── File Card ──────────────────────────────────────────────────────────────
function FileCard({ blob, i, onCopy, onDownload, onDelete }: {
  blob: BlobMetadata; i: number; onCopy: () => void; onDownload: () => void; onDelete: () => void;
}) {
  const suffix = getBlobNameSuffix(blob.name.toString());
  const icon = extIcon(suffix);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ animation: `cardIn 0.4s ${i * 40}ms cubic-bezier(0.16,1,0.3,1) both` }}
      className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-stone-800 bg-stone-900/50 hover:bg-stone-800/60 hover:border-stone-700 transition-all duration-200">
      <div className="w-11 h-11 rounded-xl bg-stone-800 group-hover:bg-stone-700 flex items-center justify-center text-lg shrink-0 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-100 truncate">{suffix}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-stone-500">{fmt(blob.size)}</span>
          <span className="text-stone-700 text-xs">·</span>
          <span className="text-xs text-stone-500">{fmtDate(blob.creationMicros)}</span>
          {blob.isWritten
            ? <span className="text-xs text-emerald-500 bg-emerald-950/50 border border-emerald-900/60 px-1.5 py-px rounded-full">on-chain ✓</span>
            : <span className="text-xs text-amber-500 bg-amber-950/50 border border-amber-900/60 px-1.5 py-px rounded-full animate-pulse">confirming…</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Download */}
        <button onClick={onDownload} title="Download file" style={{ cursor: "pointer" }}
          className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors text-stone-400 hover:text-stone-100">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5v8M7 9.5l-3-3M7 9.5l3-3M1.5 12.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {/* Copy link */}
        <button onClick={handleCopy} style={{ cursor: "pointer" }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all
            ${copied
              ? "bg-emerald-900/50 border border-emerald-700/60 text-emerald-300"
              : "bg-amber-500/15 border border-amber-700/40 text-amber-300 hover:bg-amber-500/25 hover:text-amber-200"}`}>
          {copied ? (
            <><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> Copied!</>
          ) : (
            <><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M4 7l2.5-2.5M6 4.5H7.5a2 2 0 010 4H6M5 6.5H3.5a2 2 0 010-4H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg> Copy Link</>
          )}
        </button>
        {/* Delete */}
        <button onClick={onDelete} title="Delete file" style={{ cursor: "pointer" }}
          className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-rose-950/60 hover:border hover:border-rose-900/60 flex items-center justify-center transition-colors text-stone-600 hover:text-rose-400">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 3.5h9M5 3.5V2.5a1 1 0 012 0v1M5.5 6v3.5M7.5 6v3.5M3 3.5l.5 7a1 1 0 001 .9h4a1 1 0 001-.9l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Home() {
  const wallet = useWallet();
  const { account, connected } = wallet;
  const [toasts, setToasts] = useState<T[]>([]);
  const tid = useRef(0);
  const [names, setNames] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<BlobMetadata | null>(null);

  const toast = useCallback((msg: string, kind: Kind = "info") => {
    const id = ++tid.current;
    setToasts(p => [...p, { id, msg, kind }]);
  }, []);
  const rmToast = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);

  // ── Fetch blobs — only when connected ──────────────────────────────────
  const { data: blobs, isLoading, error, refetch } = useAccountBlobs({
    account: account?.address.toString() ?? "0x1",
    pagination: { limit: 100, offset: 0 },
    enabled: connected && !!account,
  } as any);

  // ── Upload ─────────────────────────────────────────────────────────────
  const upload = useUploadBlobs({
    onSuccess: () => {
      toast("File uploaded to Shelby! 🎉 Share the link with anyone.", "success");
      setNames([]);
      // Refetch after a short delay to let the indexer catch up
      setTimeout(() => refetch(), 2500);
    },
    onError: (err: Error) => {
      const msg = err.message?.includes("multipart")
        ? "Upload failed — file may be too large or network timed out. Try a smaller file."
        : `Upload failed: ${err.message}`;
      toast(msg, "error");
      setNames([]);
    },
  });

  // ── Delete ─────────────────────────────────────────────────────────────
  const deleteBlobs = useDeleteBlobs({
    onSuccess: () => {
      toast("File deleted from Shelby blockchain.", "info");
      setDeleteTarget(null);
      setTimeout(() => refetch(), 2000);
    },
    onError: (err: Error) => {
      toast(`Delete failed: ${err.message}`, "error");
      setDeleteTarget(null);
    },
  });

  const handleFiles = useCallback(async (files: File[]) => {
    if (!connected || !account) { toast("Connect your Petra wallet first.", "error"); return; }

    // Shelbynet multipart (>5MB) is unstable on testnet — warn and block
    const tooBig = files.filter(f => f.size > 4.5 * 1024 * 1024);
    if (tooBig.length > 0) {
      toast(
        `"${tooBig[0].name}" is over 4.5 MB. Shelbynet testnet has issues with large files — please use files under 4.5 MB for now.`,
        "error"
      );
      return;
    }

    setNames(files.map(f => f.name));
    try {
      const blobs = await Promise.all(files.map(async f => ({
        blobName: f.name,
        blobData: new Uint8Array(await f.arrayBuffer()),
      })));
      upload.mutate({ signer: wallet, blobs, expirationMicros: (Date.now() + EXPIRY_MS) * 1000 });
    } catch {
      toast("Could not read files.", "error");
      setNames([]);
    }
  }, [connected, account, wallet, upload, toast]);

  const handleCopy = (blob: BlobMetadata) => {
    const url = shareableUrl(blob.name.toString());
    navigator.clipboard.writeText(url)
      .then(() => toast("Share link copied! Anyone with it can view & download the file.", "success"))
      .catch(() => toast("Clipboard access denied.", "error"));
  };

  const handleDownload = (blob: BlobMetadata) => {
    const suffix = getBlobNameSuffix(blob.name.toString());
    // Download via our proxy page which adds the API key
    window.open(rpcUrl(blob.name.toString()), "_blank");
    toast(`Opening ${suffix}…`, "info");
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const suffix = getBlobNameSuffix(deleteTarget.name.toString());
    deleteBlobs.mutate({ signer: wallet, blobNames: [suffix] });
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "#0c0a08" }}>
      <style>{`
        @keyframes toastIn { from { transform:translateX(110%);opacity:0 } to { transform:translateX(0);opacity:1 } }
        @keyframes cardIn  { from { transform:translateY(12px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        @keyframes fadeUp  { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        * { cursor: inherit; }
        a, button { cursor: pointer; }
        button:disabled { cursor: not-allowed; }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180,120,40,0.12), transparent)" }} />
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,200,100,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,100,0.03) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-800/70 backdrop-blur-xl" style={{ background: "rgba(12,10,8,0.85)" }}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l5-5 3 3 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 14h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-stone-100">Linker</span>
            <span className="hidden sm:flex items-center gap-1.5 text-xs border border-amber-800/50 text-amber-500/80 px-2.5 py-1 rounded-full" style={{ background: "rgba(120,80,0,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Shelbynet
            </span>
          </div>
          <WalletBtn toast={toast} />
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-5 md:px-8 py-14 pb-28">

        {/* Hero */}
        <div style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1)" }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-800/40 text-amber-500/80 text-xs font-medium mb-5" style={{ background: "rgba(120,80,0,0.15)" }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l1 3h3l-2.5 1.8.9 3L5 7.2 2.6 8.8l.9-3L1 4h3z" /></svg>
            Decentralized storage · Shelby · Aptos blockchain
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-[1.1]">
            <span className="text-stone-100">Share files.</span><br />
            <span style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24,#fde68a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Own them forever.</span>
          </h1>
          <p className="text-stone-500 text-base max-w-md mx-auto leading-relaxed">
            Upload any file — image, PDF, video, document. Get a permanent link anyone can open. No server that can go down.
          </p>
        </div>

        {/* Steps */}
        <div style={{ animation: "fadeUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both" }} className="grid grid-cols-3 gap-3 mb-10">
          {[
            { n: "1", title: "Connect", desc: "Link your Petra wallet to Shelbynet", icon: "🔐" },
            { n: "2", title: "Sign & Upload", desc: "Approve the Aptos transaction in Petra", icon: "✍️" },
            { n: "3", title: "Share", desc: "Copy a direct link — anyone can download", icon: "🔗" },
          ].map(s => (
            <div key={s.n} className="rounded-2xl border border-stone-800 p-4 text-center" style={{ background: "rgba(28,24,20,0.8)" }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-xs font-bold text-amber-500/70 mb-1">Step {s.n}</div>
              <p className="text-sm font-semibold text-stone-200">{s.title}</p>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Upload zone */}
        <div style={{ animation: "fadeUp 0.5s 0.2s cubic-bezier(0.16,1,0.3,1) both" }}>
          <DropZone onFiles={handleFiles} uploading={upload.isPending} names={names} connected={connected} />
        </div>

        {/* Files */}
        <section style={{ animation: "fadeUp 0.5s 0.3s cubic-bezier(0.16,1,0.3,1) both" }} className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest">My Files</h2>
              {blobs && blobs.length > 0 && (
                <span className="text-xs bg-stone-800 text-stone-400 border border-stone-700 px-2 py-px rounded-full">{blobs.length}</span>
              )}
            </div>
            {connected && !isLoading && (
              <button onClick={() => refetch()} style={{ cursor: "pointer" }}
                className="text-xs text-stone-600 hover:text-stone-400 transition-colors flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M9.5 5.5a4 4 0 11-1.17-2.83" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M9.5 2v3.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Refresh
              </button>
            )}
          </div>

          {!connected && (
            <div className="rounded-2xl border border-stone-800 p-12 text-center" style={{ background: "rgba(28,24,20,0.5)" }}>
              <div className="text-4xl mb-4">🔐</div>
              <p className="text-stone-400 font-medium">Connect your wallet to see your files</p>
              <p className="text-stone-600 text-sm mt-1">All uploads are tied to your Aptos wallet address</p>
            </div>
          )}

          {connected && isLoading && (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-stone-900 animate-pulse" style={{ animationDelay: `${i*80}ms` }} />)}
            </div>
          )}

          {connected && error && (
            <div className="rounded-2xl border border-rose-900/40 p-6 text-center" style={{ background: "rgba(40,10,10,0.5)" }}>
              <p className="text-rose-400 font-medium text-sm">Could not load files</p>
              <p className="text-rose-900 text-xs mt-1 mb-3">The indexer may still be syncing. Try refreshing in a moment.</p>
              <button onClick={() => refetch()} style={{ cursor: "pointer" }}
                className="text-xs text-rose-400 border border-rose-900 px-3 py-1.5 rounded-lg hover:bg-rose-950/50 transition-colors">
                Try again
              </button>
            </div>
          )}

          {connected && !isLoading && !error && (!blobs || blobs.length === 0) && (
            <div className="rounded-2xl border border-stone-800 p-12 text-center" style={{ background: "rgba(28,24,20,0.5)" }}>
              <div className="text-4xl mb-4">📭</div>
              <p className="text-stone-400 font-medium">No files yet</p>
              <p className="text-stone-600 text-sm mt-1">Upload anything above — images, PDFs, docs, videos, anything</p>
            </div>
          )}

          {connected && !isLoading && blobs && blobs.length > 0 && (
            <div className="flex flex-col gap-3">
              {blobs.map((blob, i) => (
                <FileCard key={blob.name.toString()} blob={blob} i={i}
                  onCopy={() => handleCopy(blob)}
                  onDownload={() => handleDownload(blob)}
                  onDelete={() => setDeleteTarget(blob)} />
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-stone-700 mt-16">
          Files stored as immutable blobs on Shelby · Aptos blockchain · No central server
        <br />
        © {new Date().getFullYear()} Beauty Benedict · All rights reserved
        </p>
      </main>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          fileName={getBlobNameSuffix(deleteTarget.name.toString())}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleteBlobs.isPending}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastEl t={t} rm={() => rmToast(t.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}