"use client";

import { useCallback, useState, useRef } from "react";

interface UploadZoneProps {
  onFileDrop: (files: File[]) => void;
  isUploading: boolean;
  uploadingFiles: string[];
  connected: boolean;
}

export function UploadZone({ onFileDrop, isUploading, uploadingFiles, connected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFileDrop(files);
    },
    [onFileDrop],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onFileDrop(files);
    e.target.value = "";
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !isUploading && connected && fileInputRef.current?.click()}
      className={`
        relative rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer
        ${isDragging
          ? "border-indigo-500 bg-indigo-500/5 scale-[1.01]"
          : "border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.03]"
        }
        ${(!connected || isUploading) ? "cursor-not-allowed opacity-60" : ""}
        p-12 text-center select-none
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInput}
        disabled={!connected || isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-indigo-400 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-300">Uploading to Shelby…</p>
            <div className="mt-2 flex flex-wrap gap-1.5 justify-center max-w-sm mx-auto">
              {uploadingFiles.map((name) => (
                <span
                  key={name}
                  className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full font-['DM_Sans',sans-serif] truncate max-w-[160px]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
              isDragging ? "bg-indigo-500/20" : "bg-white/5"
            }`}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              className={`transition-colors ${isDragging ? "text-indigo-400" : "text-white/30"}`}
            >
              <path
                d="M14 18V8M14 8l-4 4M14 8l4 4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 20h16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className={`font-semibold transition-colors ${isDragging ? "text-indigo-300" : "text-white/60"}`}>
              {isDragging ? "Release to upload" : "Drop files here"}
            </p>
            <p className="text-sm text-white/25 mt-1 font-['DM_Sans',sans-serif]">
              {connected
                ? "or click to browse — any file type, any size"
                : "Connect your wallet to upload files"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}