"use client";

import { useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

const styles: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error:   "border-red-500/30 bg-red-500/10 text-red-300",
  info:    "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
};

const icons: Record<ToastType, string> = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
};

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onRemove(toast.id)}
          className={`
            animate-toast-in pointer-events-auto flex items-center gap-3
            px-4 py-3 rounded-xl border backdrop-blur-sm shadow-2xl
            cursor-pointer text-sm font-['DM_Sans',sans-serif]
            ${styles[toast.type]}
          `}
        >
          <span className="font-bold text-xs w-4 text-center">{icons[toast.type]}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}