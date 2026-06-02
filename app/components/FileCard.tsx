"use client";

interface Blob {
  name: string;
  size?: number;
  created_at?: string;
  uploadedAt?: string;
  url?: string;
  downloadUrl?: string;
  [key: string]: any;
}

interface FileCardProps {
  blob: Blob;
  index: number;
  onCopyLink: () => void;
  onDownload: () => void;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, { icon: string; color: string }> = {
    pdf:  { icon: "📄", color: "bg-red-500/10 text-red-400" },
    png:  { icon: "🖼️", color: "bg-purple-500/10 text-purple-400" },
    jpg:  { icon: "🖼️", color: "bg-purple-500/10 text-purple-400" },
    jpeg: { icon: "🖼️", color: "bg-purple-500/10 text-purple-400" },
    gif:  { icon: "🖼️", color: "bg-purple-500/10 text-purple-400" },
    mp4:  { icon: "🎬", color: "bg-blue-500/10 text-blue-400" },
    mov:  { icon: "🎬", color: "bg-blue-500/10 text-blue-400" },
    mp3:  { icon: "🎵", color: "bg-green-500/10 text-green-400" },
    wav:  { icon: "🎵", color: "bg-green-500/10 text-green-400" },
    zip:  { icon: "📦", color: "bg-yellow-500/10 text-yellow-400" },
    json: { icon: "{ }", color: "bg-indigo-500/10 text-indigo-400" },
    ts:   { icon: "</>", color: "bg-indigo-500/10 text-indigo-400" },
    tsx:  { icon: "</>", color: "bg-indigo-500/10 text-indigo-400" },
    js:   { icon: "</>", color: "bg-yellow-500/10 text-yellow-400" },
  };
  return icons[ext] || { icon: "📁", color: "bg-white/5 text-white/40" };
}

export function FileCard({ blob, index, onCopyLink, onDownload }: FileCardProps) {
  const { icon, color } = getFileIcon(blob.name);
  const dateStr = blob.created_at || blob.uploadedAt;

  return (
    <div
      className="animate-slide-up group flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* File type icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0 ${color}`}>
        {icon}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{blob.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-white/30 font-['DM_Sans',sans-serif]">{formatBytes(blob.size)}</span>
          {dateStr && (
            <>
              <span className="text-white/15">·</span>
              <span className="text-xs text-white/30 font-['DM_Sans',sans-serif]">{formatDate(dateStr)}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDownload}
          title="Download"
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1v8M7 9l-3-3M7 9l3-3M2 12h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={onCopyLink}
          title="Copy shareable link"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-colors font-['DM_Sans',sans-serif]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M4.5 7.5l3-3M7 4.5h1.5a2 2 0 010 4H7M5 7.5H3.5a2 2 0 010-4H5"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
          Copy Link
        </button>
      </div>
    </div>
  );
}