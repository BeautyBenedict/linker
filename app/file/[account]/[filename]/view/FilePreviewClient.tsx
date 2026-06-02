"use client";

import { useState } from "react";

interface Props {
  fileName: string;
  contentType: string;
  contentLength: string | null;
  downloadUrl: string;
  account: string;
}

function fmt(bytes: string | null) {
  if (!bytes) return "Unknown size";
  const n = parseInt(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}

function extIcon(name: string, type: string) {
  if (type.startsWith("image/")) return "🖼";
  if (type.startsWith("video/")) return "🎬";
  if (type.startsWith("audio/")) return "🎵";
  if (type === "application/pdf") return "📄";
  const e = name.split(".").pop()?.toLowerCase() ?? "";
  if (["doc","docx"].includes(e)) return "📝";
  if (["xls","xlsx","csv"].includes(e)) return "📊";
  if (["zip","tar","gz","rar"].includes(e)) return "📦";
  if (["ts","tsx","js","jsx","json"].includes(e)) return "💻";
  return "📁";
}

function short(addr: string) {
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

export default function FilePreviewClient({ fileName, contentType, contentLength, downloadUrl, account }: Props) {
  const [downloading, setDownloading] = useState(false);

  const isImage = contentType.startsWith("image/");
  const isVideo = contentType.startsWith("video/");
  const isAudio = contentType.startsWith("audio/");
  const isPdf = contentType === "application/pdf";
  const canPreview = isImage || isVideo || isAudio || isPdf;

  const handleDownload = () => {
    setDownloading(true);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    a.click();
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: "#0c0a08" }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180,120,40,0.10), transparent)" }} />
      <div className="fixed inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: "linear-gradient(rgba(255,200,100,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,100,0.03) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Header */}
      <header className="relative z-10 border-b border-stone-800/70 backdrop-blur-xl px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(12,10,8,0.85)" }}>
        <a href="/" style={{ cursor: "pointer" }} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M3 9l5-5 3 3 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 14h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-tight text-stone-100">Linker</span>
        </a>
        <span className="flex items-center gap-1.5 text-xs border border-amber-800/50 text-amber-500/80 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(120,80,0,0.2)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Shelbynet
        </span>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-5 py-12 max-w-2xl mx-auto w-full">

        {/* File info card */}
        <div className="w-full rounded-3xl border border-stone-800 p-6 mb-6"
          style={{ background: "rgba(28,24,20,0.9)" }}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-800 flex items-center justify-center text-2xl shrink-0">
              {extIcon(fileName, contentType)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-stone-100 break-all leading-snug">{fileName}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span className="text-sm text-stone-500">{fmt(contentLength)}</span>
                <span className="text-stone-700">·</span>
                <span className="text-sm text-stone-500 font-mono">{contentType}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-stone-600">Uploaded by</span>
                <span className="text-xs font-mono text-amber-600/80 bg-amber-950/30 border border-amber-900/30 px-2 py-0.5 rounded-full">
                  {short(account)}
                </span>
              </div>
            </div>
          </div>

          {/* On-chain badge */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-900/40 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-500 font-medium">Stored on Shelby · Aptos blockchain · Immutable</span>
          </div>
        </div>

        {/* Preview */}
        {canPreview && (
          <div className="w-full rounded-3xl border border-stone-800 overflow-hidden mb-6"
            style={{ background: "rgba(20,16,12,0.95)" }}>
            <div className="px-4 py-3 border-b border-stone-800 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
              <span className="text-xs text-stone-500 font-medium uppercase tracking-widest">Preview</span>
            </div>
            <div className="p-4 flex items-center justify-center min-h-48">
              {isImage && (
                <img src={downloadUrl} alt={fileName}
                  className="max-w-full max-h-[480px] rounded-2xl object-contain shadow-2xl" />
              )}
              {isVideo && (
                <video controls className="max-w-full max-h-[480px] rounded-2xl shadow-2xl">
                  <source src={downloadUrl} type={contentType} />
                  Your browser does not support video playback.
                </video>
              )}
              {isAudio && (
                <div className="w-full px-4 py-8 flex flex-col items-center gap-4">
                  <div className="text-5xl">🎵</div>
                  <p className="text-stone-400 text-sm">{fileName}</p>
                  <audio controls className="w-full max-w-sm">
                    <source src={downloadUrl} type={contentType} />
                  </audio>
                </div>
              )}
              {isPdf && (
                <iframe src={`${downloadUrl}#toolbar=0`} className="w-full rounded-xl border border-stone-700"
                  style={{ height: "500px" }} title={fileName} />
              )}
            </div>
          </div>
        )}

        {/* No preview */}
        {!canPreview && (
          <div className="w-full rounded-3xl border border-stone-800 p-12 text-center mb-6"
            style={{ background: "rgba(20,16,12,0.95)" }}>
            <div className="text-5xl mb-4">{extIcon(fileName, contentType)}</div>
            <p className="text-stone-400 font-medium">No preview available for this file type</p>
            <p className="text-stone-600 text-sm mt-1">Download it to view on your device</p>
          </div>
        )}

        {/* Download button */}
        <button onClick={handleDownload} disabled={downloading} style={{ cursor: downloading ? "wait" : "pointer" }}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-base
            text-stone-950 disabled:opacity-60 transition-all shadow-xl shadow-amber-900/30 active:scale-[0.98]"
          style={{ background: downloading ? "#d97706" : "linear-gradient(135deg,#f59e0b,#d97706)" }}>
          {downloading ? (
            <><svg className="animate-spin w-5 h-5" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" className="opacity-25" />
              <path d="M10 2a8 8 0 018 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-90" />
            </svg> Downloading…</>
          ) : (
            <><svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v11M10 14l-4-4M10 14l4-4M3 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg> Download {fileName}</>
          )}
        </button>

        <p className="text-center text-xs text-stone-700 mt-6">
          This file is shared via <span className="text-amber-700">Linker</span> — decentralized storage on the Aptos blockchain
        </p>
      </main>
    </div>
  );
}