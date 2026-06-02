"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function WalletSelector() {
  const { connect, disconnect, account, connected, wallets } = useWallet();
  const [open, setOpen] = useState(false);

  if (connected && account) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {truncate(account.address.toString())}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#13131a] shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs text-white/40 font-['DM_Sans',sans-serif]">Connected</p>
              <p className="text-sm font-medium mt-0.5 truncate">{truncate(account.address.toString())}</p>
            </div>
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors font-['DM_Sans',sans-serif]"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-semibold"
      >
        Connect Wallet
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#13131a] shadow-2xl z-50 overflow-hidden">
          <p className="px-4 py-3 text-xs text-white/40 border-b border-white/5 font-['DM_Sans',sans-serif]">
            Select a wallet
          </p>
          {wallets && wallets.length > 0 ? (
            wallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => { connect(wallet.name); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-sm font-['DM_Sans',sans-serif]"
              >
                {wallet.icon && (
                  <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 rounded-lg" />
                )}
                {wallet.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-4 text-xs text-white/30 font-['DM_Sans',sans-serif]">
              No wallets found. Install{" "}
              <a
                href="https://petra.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 underline"
              >
                Petra
              </a>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}